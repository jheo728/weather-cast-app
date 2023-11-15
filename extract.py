import requests
import functools
import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()


@functools.lru_cache()
def forecast_query(endpoint: str, lat: float, lon: float):
    try:
        weather_r = requests.get(f'https://api.weather.gov/{endpoint}/{lat},{lon}')
        weather_r.raise_for_status()

        # Check for a forecast URL in the response
        properties = weather_r.json().get('properties', {})
        forecast_url = properties.get('forecast', None)

        if forecast_url:
            forecast_r = requests.get(forecast_url)
            forecast_r.raise_for_status()

            return forecast_r.json()
        else:
            logger.error("No forecast URL found in the response.")
            return None

    except requests.exceptions.RequestException as e:
        logger.error(f'Request Error: {e}')
    except KeyError as e:
        logger.error('Invalid response from the API. Check endpoint str, lat, or lon arguments.')
