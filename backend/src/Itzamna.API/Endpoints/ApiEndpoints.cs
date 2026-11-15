using System.Text.Json;
using Itzamna.API.Gateway;

namespace Itzamna.API.Endpoints;

public sealed class SearchRequest
{
    public string Planet { get; set; } = string.Empty;
    public Dictionary<string, string> Earth { get; set; } = new();
    public Dictionary<string, string> Zone { get; set; } = new();
    public Dictionary<string, string> Tags { get; set; } = new();
    public LocationRequest? Location { get; set; }
    public UserLocationRequest? UserLocation { get; set; }
    public bool PreferIsolated { get; set; } = true;
    public bool PreferAccessible { get; set; } = true;
}

public sealed class LocationRequest
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public double RadiusKm { get; set; }
}

public sealed class UserLocationRequest
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}

public static class ApiEndpoints
{
    public static IEndpointRouteBuilder MapApiEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/health", () => Results.Ok(new
        {
            status = "healthy",
            service = "backend"
        }));

        app.MapGet("/api/health/scientific-engine", async (ScientificEngineGateway gateway) =>
        {
            var (ok, statusCode, payload) = await gateway.GetHealthAsync();
            if (!ok)
            {
                return Results.Problem(
                    detail: $"Scientific engine health check failed with status code {statusCode}.",
                    statusCode: StatusCodes.Status503ServiceUnavailable,
                    title: "Scientific engine unavailable");
            }

            return Results.Ok(new
            {
                status = "healthy",
                service = "backend",
                scientificEngine = new
                {
                    baseUrl = gateway.BaseUrl,
                    healthEndpoint = "/health",
                    status = "healthy",
                    response = payload
                }
            });
        });

        app.MapPost("/api/analogs/search", async (HttpRequest request, ScientificEngineGateway gateway, CancellationToken ct) =>
        {
            using var reader = new StreamReader(request.Body);
            var body = await reader.ReadToEndAsync(ct);

            if (string.IsNullOrWhiteSpace(body))
            {
                return Results.BadRequest(new { error = "Request body is required." });
            }

            SearchRequest? searchRequest;
            try
            {
                searchRequest = JsonSerializer.Deserialize<SearchRequest>(body, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (JsonException ex)
            {
                return Results.BadRequest(new
                {
                    error = "Invalid JSON body.",
                    detail = ex.Message
                });
            }

            if (searchRequest is null)
            {
                return Results.BadRequest(new { error = "Request body could not be parsed." });
            }

            searchRequest.Earth ??= new Dictionary<string, string>();
            searchRequest.Zone ??= new Dictionary<string, string>();
            searchRequest.Tags ??= new Dictionary<string, string>();

            var normalizedBody = JsonSerializer.Serialize(searchRequest, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var (ok, statusCode, responseBody, error) = await gateway.SearchAnalogsAsync(normalizedBody, ct);

            if (!ok)
            {
                if (error is not null)
                {
                    return Results.Problem(
                        detail: error,
                        statusCode: StatusCodes.Status503ServiceUnavailable,
                        title: "Scientific engine unavailable");
                }

                return Results.Problem(
                    detail: $"Scientific engine error ({statusCode}): {responseBody}",
                    statusCode: StatusCodes.Status502BadGateway,
                    title: "Search failed");
            }

            return Results.Content(responseBody, "application/json");
        });

        return app;
    }
}
