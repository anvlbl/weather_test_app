import Express, { request, response } from 'express';
import axios from 'axios';

const app = new Express();

const port = 3301;
const apiKey = '6429b456c66f2c51137cacf8b7a5169c';
const cityName = 'moscow';

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.get('/', (request, responce) => {
    responce.send('main page');
})

app.get('/weather', (request, responce) => {
    const openWeatherLink = `http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;
    axios.get(openWeatherLink)
        .then(res => {
            const localData = res.data;
            const temp = Math.round(localData.main.temp - 273);
            const main = localData.weather[0].description;
            responce.send(`local temperature - ${temp}, desc - ${main}`);
        })
        .catch(err => responce.send('error')) 
})

app.listen(port, () => {
    console.log(`server started on port 3301`);
})