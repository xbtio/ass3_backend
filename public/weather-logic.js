const form = document.getElementById('location-form')

form.addEventListener("submit", async function (event) {
    event.preventDefault()
    const userId = window.location.pathname.split('/').pop();
    const response = await fetch(`/main/${userId}`, {
        method: "POST",
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({ location: document.getElementById('location-input').value })
    });

    
    const data = await response.json();
    const temperature = data.weather.main.temp;
    const feelslike = data.weather.main.feels_like;
    const description = data.weather.weather[0].description
    const icon = data.weather.weather[0].icon
    const icon_num = (icon.slice(0, 2))


    document.getElementById('sunny').style.display = 'none'
    document.getElementById('cloudy').style.display = 'none'
    document.getElementById('stormy').style.display = 'none'
    document.getElementById('snowy').style.display = 'none'
    
    if(icon_num == '01') {
        document.getElementById('sunny').style.display = 'block'
    }
    if(icon_num == '02' || icon_num == '03' || icon_num == '04') {
        document.getElementById('cloudy').style.display = 'block'
    }
    if(icon_num == '09' || icon_num == '10' || icon_num == '11') {
        document.getElementById('stormy').style.display = 'block'
    }
    if(icon_num == '13') {
        document.getElementById('snowy').style.display = 'block'
    }

    const date = new Date()
    const dayOfWeek = date.getDay();
    const month = date.getMonth();
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();

    function getDayName(day) {
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return daysOfWeek[day];
    }
    
    function getMonthName(month) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return months[month];
    }

    document.getElementById('day').innerHTML = `${getDayName(dayOfWeek)}`
    document.getElementById('date').innerHTML = `${getMonthName(month)}, ${dayOfMonth} ${year}`


    const humidity = data.weather.main.humidity
    const pressure = data.weather.main.pressure
    const windspeed = data.weather.wind.speed
    const countryCode = data.weather.sys.country

    initMap(data.lat, data.lon);


    document.getElementById('temperature').innerHTML = `${temperature}`
    document.getElementById('windspeed').innerHTML = `${windspeed}`
    document.getElementById('humidity').innerHTML = `${humidity}`
    document.getElementById('pressure').innerHTML = `${pressure}`
    document.getElementById('feelslike').innerHTML = `${feelslike}`
    document.getElementById('description').innerHTML = `${description}`

    
    const AQbar = document.getElementById("AQ");

    if(data.AQ.aqi) {
        AQbar.style.setProperty("--progress", `${data.AQ.aqi}%`);
    } else {
        AQbar.style.setProperty("--progress", `0%`);
    }
    

    const SRbar = document.getElementById("SR");

    SRbar.style.setProperty("--progress", `${data.SR}%`);

})  
    