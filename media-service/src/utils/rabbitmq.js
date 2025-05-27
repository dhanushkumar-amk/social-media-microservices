
const  amqp = require('amqplib');
const logger = require('./logger')

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'facebook_events'

async function connectToRabbitMq(){
    try {
        connection = await amqp.connect("amqp://localhost:5672");
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

async function consumeEvents(routingKey, callback){
     if(!channel) {
        await connectToRabbitMq();
    }

    const q  = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

    channel.consume(q.queue, (msg) => {
        if (msg !== null) {
            const messageContent = JSON.parse(msg.content.toString());
            logger.info(`Received message with routing key: ${routingKey}`);
            callback(messageContent);
            channel.ack(msg);
        }
    }, { noAck: false });
}

module.exports = { connectToRabbitMq, publishEvent, consumeEvents}
