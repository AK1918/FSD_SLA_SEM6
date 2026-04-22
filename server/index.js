const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT"]
  }
});

app.use(cors());
app.use(express.json());

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-tracking', (requestId) => {
    socket.join(requestId);
    console.log(`User joined tracking for request: ${requestId}`);
  });

  socket.on('update-location', (data) => {
    // data: { requestId, lat, lng, status }
    io.to(data.requestId).emit('location-receive', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Export io to use in controllers
app.set('io', io);

app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/tracking', require('./routes/trackingRoutes'));

app.get('/', (req, res) => {
  res.send('EcoBite API is running...');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
