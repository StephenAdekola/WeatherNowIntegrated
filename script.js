// Weather code -> icon & description
// (WMO codes, same scheme real weather APIs use)
function getWeatherInfo(code) {
  const map = {
    0: { desc: 'clear sky', icon: '☀️' },
    1: { desc: 'mainly clear', icon: '🌤️' },
    2: { desc: 'partly cloudy', icon: '⛅' },
    3: { desc: 'overcast', icon: '☁️' },
    45: { desc: 'fog', icon: '🌫️' },
    51: { desc: 'light drizzle', icon: '🌦️' },
    61: { desc: 'light rain', icon: '🌧️' },
    63: { desc: 'rain', icon: '🌧️' },
    71: { desc: 'light snow', icon: '🌨️' },
    80: { desc: 'rain showers', icon: '🌦️' },
    95: { desc: 'thunderstorm', icon: '⛈️' },
  };
  return map[code] || { desc: 'unknown', icon: '🌡️' };
}

// Backend API
// This now talks to the real Weather Now API from Projects 2 & 3,
// instead of the local WEATHER_DATA object used earlier.
const API_BASE_URL = 'https://weathernowbackend.vercel.app';

// State
let currentUnit = 'C'; // 'C' or 'F'
let latestData = null; // last successful lookup, so the unit toggle can re-render without a new request

// DOM references
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const statusMessage = document.getElementById('statusMessage');
const dashboard = document.getElementById('dashboard');
const unitToggle = document.getElementById('unitToggle');
const locationEl = document.getElementById('location');
const currentIconEl = document.getElementById('currentIcon');
const currentTempEl = document.getElementById('currentTemp');
const currentDescEl = document.getElementById('currentDesc');
const tempHighEl = document.getElementById('tempHigh');
const tempLowEl = document.getElementById('tempLow');
const windSpeedEl = document.getElementById('windSpeed');
const forecastGrid = document.getElementById('forecastGrid');
const unitLabels = document.querySelectorAll('.unit-label');

// Helpers
function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

function formatTemp(celsiusValue) {
  const value = currentUnit === 'C' ? celsiusValue : celsiusToFahrenheit(celsiusValue);
  return Math.round(value);
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('is-error', isError);
}

function dayLabel(offset) {
  if (offset === 0) return 'Today';
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// Render
// city here is exactly the JSON shape the backend returns:
// { name, country, current_temp, current_code, wind_speed, forecast: [{high, low, weathercode}, ...] }
function renderWeather(city) {
  latestData = city;

  locationEl.textContent = `${city.name}, ${city.country}`;
  const { desc, icon } = getWeatherInfo(city.current_code);
  currentIconEl.textContent = icon;
  currentDescEl.textContent = desc;
  currentTempEl.textContent = formatTemp(city.current_temp);
  tempHighEl.textContent = `${formatTemp(city.forecast[0].high)}°`;
  tempLowEl.textContent = `${formatTemp(city.forecast[0].low)}°`;
  windSpeedEl.textContent = `${city.wind_speed} km/h`;

  forecastGrid.innerHTML = '';
  city.forecast.forEach((day, index) => {
    const { icon: dayIcon } = getWeatherInfo(day.weathercode);
    const card = document.createElement('div');
    card.className = 'forecast-day';
    card.innerHTML = `
      <p class="day-name">${dayLabel(index)}</p>
      <p class="day-icon" aria-hidden="true">${dayIcon}</p>
      <p class="day-temps"><strong>${formatTemp(day.high)}°</strong> / ${formatTemp(day.low)}°</p>
    `;
    forecastGrid.appendChild(card);
  });

  unitLabels.forEach((label) => {
    label.textContent = `°${currentUnit}`;
  });

  dashboard.hidden = false;
}

// Fetch weather from the real backend API
async function fetchWeather(query) {
  setStatus('Loading weather…');
  dashboard.hidden = true;

  try {
    const response = await fetch(`${API_BASE_URL}/weather/${encodeURIComponent(query.trim())}`);

    // A 404 (or any non-2xx) does NOT throw on its own — it has to be
    // checked explicitly before trying to parse the body as JSON.
    if (!response.ok) {
      if (response.status === 404) {
        setStatus(`Couldn't find "${query}". Try one of the sample cities below.`, true);
      } else {
        setStatus('Something went wrong fetching the weather. Please try again.', true);
      }
      return;
    }

    const data = await response.json();
    renderWeather(data);
    setStatus('');
  } catch (err) {
    // Network failure, CORS block, DNS issue, etc.
    setStatus('Network error — check your connection and try again.', true);
  }
}

// Events
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (city) {
    fetchWeather(city);
  }
});

unitToggle.addEventListener('click', () => {
  currentUnit = currentUnit === 'C' ? 'F' : 'C';
  if (latestData) {
    renderWeather(latestData);
  }
});

document.getElementById('year').textContent = new Date().getFullYear();

// Load a default city on first visit
fetchWeather('Benin City');
