const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const path = require('path');
require("dotenv").config()
// const stripe= require('stripe')(process.env.STRIPE_SECRET_PRODUCTION)
const stripe= require('stripe')('sk_test_51Juio4HFvBdcsgQ2bkq670LJtalK67uC0IJqe8vRGnBwu9jzaufRL5Z3CbynZsv14GTsAhmocZopBMeuCrLw20HT00G7Rzbp8L')

// ('sk_test_51Juio4HFvBdcsgQ2bkq670LJtalK67uC0IJqe8vRGnBwu9jzaufRL5Z3CbynZsv14GTsAhmocZopBMeuCrLw20HT00G7Rzbp8L')

const cors = require('cors');
const { typeDefs, resolvers } = require('./schemas');
const { authMiddleware } = require('./utils/auth');
const db = require('./config/connection');

const PORT = process.env.PORT || 3001;

const app = express();

// Socket.io Stuff
const httpServer = require('http').createServer(app);
const options = {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
};
const io = require('socket.io')(httpServer, options);
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// apollo (graphql) stuff
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware,
});

apolloServer.applyMiddleware({ app });

//not sure if this is necessary, tested w out it payments still work.
app.use(
  cors({
    origin: 'http://localhost:3000',
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve up static assets
app.use('/images', express.static(path.join(__dirname, '../client/images')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

app.get('*', (req, res) => {
  console.log(`REQUEST RECEIVED`);
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: req.body.items.map(({ id, quantity }) => {
        const storeItem = storeItems.get(id);
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: storeItem.name,
            },
            unit_amount: storeItem.priceInCents,
          },
          quantity: quantity,
        };
      }),
      mode: 'payment',
      success_url: 'http://localhost:3000/',
      cancel_url: 'http://localhost:3000/donate',
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const storeItems = new Map([
  [1, { priceInCents: 10000, name: 'Learn React Today' }],
  [2, { priceInCents: 15000, name: 'Learn CSS Today' }],
]);

db.once('open', () => {
  // changed this so the app with call listen on the httpServer instead of directly on the app because the DB connection is rolled into App, and app is rolled into httpServer which also has socket.io. app still handles routing and initializing apollo, and socket.io will handle websocket traffic for chat- all 3 functions are contained within httpServer.
  httpServer.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(
      `Use GraphQL at http://localhost:${PORT}${apolloServer.graphqlPath}`
    );
  });
});
