require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const bodyParser = require("body-parser");
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const corsOptions = {
    origin: 'http://10.20.62.11:19006'
}
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.use(cors(corsOptions));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
