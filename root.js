const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const methodOverride = require('method-override');
const mongoose = require('mongoose');

const app = express();

let port = process.env.PORT || 3000;

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

const uri = 'mongodb+srv://yernar:thyfh123@cluster0.uey4bw8.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri);

async function connectToDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
    }
}

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login');
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const db = client.db();
        const user = await db.collection('users').findOne({ username, password });
        if (user) {
            if (username == 'yernar' && password == 'admin') {
                return res.redirect('/admin');
            }
            return res.redirect(`/main/${user._id}`);
        } else {
            return res.redirect('/login?error=1');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Internal server error');
    }
});


app.get('/main/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        res.render('main', { userId });
    } catch (error) {
        console.error('Error rendering main page:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/main/:userId', async (req, res) => {
    const parameters = req.body
    const db = client.db();
    const userId = req.params.userId;

    api = 'afffb769afeb11fa6d1f724d78e036a7'
    urlGeoDecoder = `http://api.openweathermap.org/geo/1.0/direct?q=${parameters.location}&appid=${api}`
    urlWeather = `https://api.openweathermap.org/data/2.5/weather?q=${parameters.location}&appid=${api}&units=metric`;
    urlAirQuality = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=AIzaSyDPWi4QzyfbxagfFWZxgYzaiaKD2OIO8yM`

    var lat;
    var lon;

    var requestBody

    var currentweather;
    var AQdata;
    var solarRadResponse;

    const usersLastData = await db.collection('weather').find({
        user: userId,
        'history.date': (new Date()).toISOString().substring(0, 10),
        'history.location': parameters.location
    }).toArray();

    if (usersLastData.length > 0) {
        console.log('Data already exists for this user and location');
        try {
            res.send({
                lat: usersLastData[0].history.weather.coord.lat,
                lon: usersLastData[0].history.weather.coord.lon,
                weather: usersLastData[0].history.weather,
                AQ: { aqi: usersLastData[0].history.airQuality.indexes[0].aqi   },
                SR: usersLastData[0].history.solarRadiation.daily.shortwave_radiation_sum[0]
            });
        } catch (error) {
            res.send({
                lat: usersLastData[0].history.weather.coord.lat,
                lon: usersLastData[0].history.weather.coord.lon,
                weather: usersLastData[0].history.weather,
                AQ: {},
                SR: usersLastData[0].history.solarRadiation.daily.shortwave_radiation_sum[0]
            });
        }
        res.status(200).end();
        return;
    }


    try {
        const LocationResponse = await fetch(urlGeoDecoder);
        const Locationdata = await LocationResponse.json();
        lat = Locationdata[0].lat;
        lon = Locationdata[0].lon;
        requestBody = {
            location: {
                latitude: lat,
                longitude: lon
            }
        };
    }
    catch {
        console.error('Error fetching Location data:', error);
        res.status(500).send('Internal Server Error');
    }


    try {
        const weather = await fetch(urlWeather)
        currentweather = await weather.json();
    }
    catch {
        console.error('Error fetching weather data:', error);
        res.status(500).send('Internal Server Error');
    }

    try {
        AQdata = await fetch(urlAirQuality, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => response.json())

    } catch (error) {
        console.error('Error fetching AQ data:', error);
        res.status(500).send('Internal Server Error');
    }

    try {
        urlSolarRad = `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}&models=FGOALS_f3_H&daily=shortwave_radiation_sum`
        solarRadResponse = await fetch(urlSolarRad).then(response => response.json())
    }
    catch (error) {
        console.error('Error fetching SolarRadiation data:', error);
        res.status(500).send('Internal Server Error');
    }


    try {


        await db.collection('weather').insertOne(
            {
                user: userId,
                history: {
                    date: (new Date()).toISOString().substring(0, 10),
                    location: parameters.location,
                    weather: currentweather,
                    airQuality: AQdata,
                    solarRadiation: solarRadResponse
                }
            }
        );
    } catch (error) {
        console.error('Error saving data to user:', error);
        return res.status(500).send('Internal Server Error');
    }

    try {
        res.send({ weather: currentweather, lat: lat, lon: lon, AQ: AQdata.indexes[0], SR: solarRadResponse.daily.shortwave_radiation_sum[0] })
    }
    catch (error) {
        res.send({ weather: currentweather, lat: lat, lon: lon, AQ: {}, SR: solarRadResponse.daily.shortwave_radiation_sum[0] })
    }

    res.status(200).end()
})

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const db = client.db();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
        return res.status(400).send('Username already exists');
    }

    try {
        await usersCollection.insertOne({ username, password, creation_date: new Date(), is_admin: false });
        const user = await db.collection('users').findOne({ username, password });
        return res.redirect(`/main/${user._id}`);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Internal server error');
    }
});

app.get('/admin', async (req, res) => {
    try {
        const db = client.db();
        const users = await db.collection('users').find().toArray();
        res.render('admin', { users });
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).send('Internal server error');
    }
});

app.post('/admin/users', async (req, res) => {
    const { username, password } = req.body;
    const db = client.db();
    const usersCollection = db.collection('users');

    try {
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(400).send('Username already exists');
        }

        const db = client.db();
        await db.collection('users').insertOne({ username, password });
        res.redirect('/admin');
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).send('Internal server error');
    }
});

app.put('/admin/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { username, password } = req.body;
    try {


        const db = client.db();
        await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { username, password, update_date: new Date() } });
        res.redirect('/admin');
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Internal server error');
    }
});

app.delete('/admin/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const db = client.db();
        await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
        res.redirect('/admin');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Internal server error');
    }
});

app.get('/admin/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const db = client.db();
        const user = await db.collection('users').findOne({ _id: ObjectId(userId) });
        if (user) {
            res.render('userDetails', { user });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).send('Internal server error');
    }
});

app.get('/history/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const db = client.db();
        const user = await db.collection('weather').find({ user: userId }).toArray();
        if (!user) {
            return res.status(404).send('Weather data not found for this user.');
        }

        res.render('history', { user });
    } catch (error) {
        console.error('Error rendering user history:', error);
        res.status(500).send('Internal Server Error');
    }
});




connectToDB();
