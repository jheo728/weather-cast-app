from extract import forecast_query
from flask import Flask, render_template, request, jsonify


app = Flask(__name__)


@app.route('/')
def index():
    # Note: render_template requires subfolder of /templates/<html file>
    return render_template('/map.html')
    # return render_template('/map.html')


@app.route('/fetch-analyze-forecast', methods=['POST'])
def fetch_analyze_forecast():
    if request.method == 'POST':
        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        # Use the received latitude and longitude in your forecast_query function
        forecast_data = forecast_query(endpoint='points', lat=latitude, lon=longitude)

        # Ensure that data was fetched from the API endpoint and stored in variable
        if forecast_data:
            updated_time = forecast_data['properties']['updated']

            # Limit to 5 forecast days (day/evening forecast periods)
            forecast_periods = forecast_data['properties']['periods'][:10]
            forecast_content = [
                {
                    'number': x['number'],
                    'name': x['name'],
                    'start_time': x['startTime'],
                    'precip_chance': x['probabilityOfPrecipitation']['value'],
                    'relative_humidity': x['relativeHumidity']['value'],
                    'wind': f"{x['windDirection']} {x['windSpeed']}",
                    'temp': str(x['temperature']),
                    'short_forecast': x['shortForecast'],
                    'details': x['detailedForecast'],
                    'img_icon': x['icon']
                }
                for x in forecast_periods
            ]

            forecast_simplified = {
                "last_update_time": updated_time,
                "forecast_content": forecast_content
            }

            return jsonify(forecast_simplified)
    
    # Handle invalid or missing data
    return jsonify({'error': 'Invalid coordinates'})


if __name__ == '__main__':
    app.run(debug=True)
