
const  amqp = require('amqplib');
const logger = require('./logger')

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'facebook_events'

async function connectToRabbitMq(){
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
         channel = await connection.createChannel();

         channel.assertExchange(EXCHANGE_NAME, "topic", {durable : false})
         logger.info("Connected to rabbit mq");
         return channel;

    } catch (error) {
        logger.error('Error connecting to RabbitMQ:', error);
        throw error;
    }
}

async function publishEvent(routingKey, message) {
    if(!channel) {
        await connectToRabbitMq();
    }
    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)))
    logger.info(`Event published with routing key: ${routingKey}`);
}


module.exports = { connectToRabbitMq, publishEvent }
