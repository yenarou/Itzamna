using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddHttpClient();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

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

app.MapPost("/api/analogs/search", async (HttpRequest request, IHttpClientFactory httpClientFactory, IConfiguration configuration) =>
{
    var baseUrl = configuration["ScientificEngine:BaseUrl"] ?? "http://localhost:8001";
    var client = httpClientFactory.CreateClient();
    try
    {
        using var reader = new StreamReader(request.Body);
        var body = await reader.ReadToEndAsync();
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        var response = await client.PostAsync($"{baseUrl.TrimEnd('/')}/analogs/search", content);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            return Results.Problem(
                detail: $"Scientific engine error ({(int)response.StatusCode}): {responseBody}",
                statusCode: StatusCodes.Status502BadGateway,
                title: "Search failed");
        }

        return Results.Content(responseBody, "application/json");
    }
    catch (Exception ex)
    {
        return Results.Problem(
            detail: ex.Message,
            statusCode: StatusCodes.Status503ServiceUnavailable,
            title: "Scientific engine unavailable");
    }
});

app.Run();

public partial class Program { }
