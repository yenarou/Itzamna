var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddHttpClient();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    service = "backend"
}));

app.MapGet("/api/health/scientific-engine", async (IHttpClientFactory httpClientFactory, IConfiguration configuration) =>
{
    var baseUrl = configuration["ScientificEngine:BaseUrl"] ?? "http://localhost:8001";
    var client = httpClientFactory.CreateClient();
    var response = await client.GetAsync($"{baseUrl.TrimEnd('/')}/health");

    if (!response.IsSuccessStatusCode)
    {
        return Results.Problem(
            detail: $"Scientific engine health check failed with status code {(int)response.StatusCode}.",
            statusCode: StatusCodes.Status503ServiceUnavailable,
            title: "Scientific engine unavailable");
    }

    var payload = await response.Content.ReadAsStringAsync();

    return Results.Ok(new
    {
        status = "healthy",
        service = "backend",
        scientificEngine = new
        {
            baseUrl,
            healthEndpoint = "/health",
            status = "healthy",
            response = payload
        }
    });
});

app.Run();

public partial class Program { }
