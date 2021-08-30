import Express, { request, response } from 'express';
import axios from 'axios';
import redis from 'redis';

const port = 8805;
const redisPort = 6379;
const apiKey = '6429b456c66f2c51137cacf8b7a5169c';
const cityName = 'moscow';

const app = new Express();
const redis_client = redis.createClient(redisPort);

redis_client.on('error', (err) => {
    console.log("Error " + err)
});

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.get('/', (request, response) => {
    response.send('main page');
})

app.get('/client', (request, response) => {
    response.send(redis_client.server_info);
})

// app.get('/weather', (request, response) => {
//     const openWeatherLink = `http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;

//     axios.get(openWeatherLink)
//     .then(res => {
//         const localData = res.data;
//         const temp = Math.round(localData.main.temp - 273);
//         const main = localData.weather[0].description;
//         response.send(`local temperature - ${temp}, desc - ${main}`);
//         response.status(200).send(localData);
//     })
//     .catch(err => response.send('error'))
// })

app.get('/outdoor/:key', (request, response) => {
    try {
        const { key } = request.params;

        redis_client.get(key, async (err, data) => {
            if (err) {
                console.error(err);
                response.status(500).send(`cache reading error`);
            }
            if (data !== null) {
                response.send(data);
            } else {
                const query = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=moscow&appid=${key}`);
                const weather = query.data;

                redis_client.setex(key, 15, JSON.stringify(weather));

                return response.send(weather);
            }
        })
    }
    catch (error) {
        response.status(500).json(error);
    }
})

app.get('/recipe/:fooditem', (req, res) => {
    try {
      const foodItem = req.params.fooditem;
    
      // Check the redis store for the data first
      redis_client.get(foodItem, async (err, recipe) => {
        if (recipe) {
          return res.status(200).send({
            error: false,
            message: `Recipe for ${foodItem} from the cache`,
            data: JSON.parse(recipe)
          })
        } else { // When the data is not found in the cache then we can make request to the server
    
            const recipe = await axios.get(`http://www.recipepuppy.com/api/?q=${foodItem}`);
    
            // save the record in the cache for subsequent request
            redis_client.setex(foodItem, 1440, JSON.stringify(recipe.data.results));
    
            // return the result to the client
            return res.status(200).send({
              error: false,
              message: `Recipe for ${foodItem} from the server`,
              data: recipe.data.results
            });
        }
      }) 
    } catch (error) {
        console.log(error)
    }
   });
   
app.listen(port, () => {
    console.log(`server started on port ${port}`);
})