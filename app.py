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
            # Limit to 5 forecast days (day/evening forecast periods)
            forecast_periods = forecast_data['properties']['periods'][:10]

            forecast_simplified = [{'number': x['number'], 'name': x['name'], 'temp': str(x['temperature'])+'F', 'details': x['detailedForecast'], 'img_icon': x['icon']} for x in forecast_periods]

            return jsonify(forecast_simplified)
    
    # Handle invalid or missing data
    return jsonify({'error': 'Invalid coordinates'})


if __name__ == '__main__':
    app.run(debug=True)
