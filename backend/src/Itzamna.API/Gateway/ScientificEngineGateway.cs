using System.Text;

namespace Itzamna.API.Gateway;

public sealed class ScientificEngineGateway(IHttpClientFactory httpClientFactory, IConfiguration configuration)
{
    private readonly string _baseUrl = (configuration["ScientificEngine:BaseUrl"] ?? "http://localhost:8001").TrimEnd('/');

    public string BaseUrl => _baseUrl;

    public async Task<(bool Ok, int StatusCode, string Body)> GetHealthAsync(CancellationToken ct = default)
    {
        var client = httpClientFactory.CreateClient();
        var response = await client.GetAsync($"{_baseUrl}/health", ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        return (response.IsSuccessStatusCode, (int)response.StatusCode, body);
    }

    public async Task<(bool Ok, int StatusCode, string Body, string? Error)> SearchAnalogsAsync(string requestBody, CancellationToken ct = default)
    {
        var client = httpClientFactory.CreateClient();
        try
        {
            using var content = new StringContent(requestBody, Encoding.UTF8, "application/json");
            var response = await client.PostAsync($"{_baseUrl}/analogs/search", content, ct);
            var body = await response.Content.ReadAsStringAsync(ct);
            return (response.IsSuccessStatusCode, (int)response.StatusCode, body, null);
        }
        catch (Exception ex)
        {
            return (false, StatusCodes.Status503ServiceUnavailable, string.Empty, ex.Message);
        }
    }
}
