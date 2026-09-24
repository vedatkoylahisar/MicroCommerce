using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);
builder.Services.AddOcelot();
builder.Services.AddHealthChecks();

var app = builder.Build();
app.UseRouting();
app.UseCors("CorsPolicy");
// /health endpoint dispatch'i burada, Ocelot'un terminal middleware'inden once gerceklesir
app.UseEndpoints(endpoints => endpoints.MapHealthChecks("/health"));
await app.UseOcelot();

app.Run();