using Itzamna.API.Gateway;

namespace Itzamna.API.Endpoints;

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
            var (ok, statusCode, responseBody, error) = await gateway.SearchAnalogsAsync(body, ct);

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
