const apiKey = "my api key";
// не публикую публично

// Элементы управления
const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city-input");
const bell = document.getElementById("bell");
const popup = document.getElementById("weather-popup");
const showAllBtn = document.getElementById("show-all-btn");


// Слушатели поиска города
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) getWeather(city);
});

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const city = cityInput.value.trim();
        if (city) getWeather(city);
    }
});


// Слушатель колокольчика
bell.addEventListener("click", () => {
    popup.style.display = popup.style.display === "block" ? "none" : "block";

    const city = document.getElementById("city-name").textContent;
    const temp = document.getElementById("temperature").textContent;
    const desc = document.getElementById("description").textContent;

    document.getElementById("popup-city").textContent = city;
    document.getElementById("popup-temp").textContent = `Температура: ${temp}`;
    document.getElementById("popup-desc").textContent = `Описание: ${desc}`;
});


// Основная функция получения погоды
async function getWeather(city) {
    try {
        // Получаем координаты города
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
        const geoData = await geoRes.json();

        if (!geoData.length) {
            alert("Город не найден!");
            return;
        }

        const { lat, lon, name } = geoData[0];

        // Получаем прогноз на 5 дней (каждые 3 часа)
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ru`;
        const res = await fetch(url);
        const data = await res.json();

        // Текущая погода
        const current = data.list[0];
        document.getElementById("city-name").textContent = name;
        document.getElementById("temperature").textContent = `${Math.round(current.main.temp)}°`;
        document.getElementById("description").textContent = current.weather[0].description;
        document.getElementById("humidity").textContent = `${current.main.humidity}%`;
        document.getElementById("pressure").textContent = `${current.main.pressure} hPa`;
        document.getElementById("wind").textContent = `${current.wind.speed} м/с`;

        // Max и Min температуры
        document.getElementById("max-temp").textContent = Math.round(current.main.temp_max);
        document.getElementById("min-temp").textContent = Math.round(current.main.temp_min);

        // Иконка текущей погоды
        const iconCode = current.weather[0].icon;
        const weatherImg = document.getElementById("weather-icon-img");
        weatherImg.src = `https://openweathermap.org/img/wn/${iconCode}@0x.png`;
        weatherImg.style.display = "block";

        
        // Почасовой прогноз (Today)
        const todayForecast = document.getElementById("today-forecast");
        todayForecast.innerHTML = "";

        data.list.slice(0, 4).forEach(hourData => {
            const date = new Date(hourData.dt * 1000);
            const hours = date.getHours();
            const temp = Math.round(hourData.main.temp);
            const icon = hourData.weather[0].icon;

            const div = document.createElement("div");
            div.className = "today-item";
            div.innerHTML = `
                <div>${hours}:00</div>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="">
                <div>${temp}°</div>
            `;
            todayForecast.appendChild(div);
        });

        
        // Прогноз на следующие дни (Next Forecast)
        const nextDaysContainer = document.getElementById("next-days");
        nextDaysContainer.innerHTML = "";
        showAllBtn.style.display = "none";

        // Группируем прогноз по дате
        const dailyForecast = {};
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });

            if (!dailyForecast[day]) dailyForecast[day] = [];
            dailyForecast[day].push(item);
        });

        // Текущая дата
        const todayDate = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "numeric" });

        // Массив всех дней кроме сегодня
        const allDays = Object.keys(dailyForecast).filter(day => {
            const firstItemDate = new Date(dailyForecast[day][0].dt * 1000);
            const firstItemDay = firstItemDate.toLocaleDateString("ru-RU", { day: "numeric", month: "numeric" });
            return firstItemDay !== todayDate;
        });

        // Функция для создания div дня
        function createDayDiv(day) {
            const dayData = dailyForecast[day];
            const avgTemp = Math.round(dayData.reduce((sum, d) => sum + d.main.temp, 0) / dayData.length);
            const icon = dayData[0].weather[0].icon;

            const div = document.createElement("div");
            div.className = "next-day";
            div.innerHTML = `
                <div>${day}</div>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="">
                <div>${avgTemp}°</div>
            `;
            return div;
        }

        // Показываем первые 2 дня
        allDays.slice(0, 2).forEach(day => {
            nextDaysContainer.appendChild(createDayDiv(day));
        });

        // Кнопка "Показать все дни"
        if (allDays.length > 2) {
            showAllBtn.style.display = "block";
            showAllBtn.onclick = () => {
                nextDaysContainer.innerHTML = "";
                allDays.forEach(day => {
                    nextDaysContainer.appendChild(createDayDiv(day));
                });
                showAllBtn.style.display = "none";
            };
        } else {
            showAllBtn.style.display = "none";
        }

        

    } catch (error) {
        alert("Ошибка соединения!");
        console.error(error);
    }
}
