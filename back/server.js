require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const bodyParser = require("body-parser");
const chatRoutes = require('./routes/chatRoutes');
const studyRoutes = require('./routes/studyRoutes.js')
const subjectRoutes = require('./routes/subjectRoutes'); // 추가
const timerRoutes = require('./routes/timerRoutes'); // 추가
const study2Routes = require('./routes/study2Routes');  // study2Routes로 변경

const app = express();
const corsOptions = {
    origin: 'http://172.30.89.34:19006'
}
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/subjects', subjectRoutes); // 추가
app.use('/api/timers', timerRoutes); // 추가
app.use('/api/study2', study2Routes);  // study2Routes 연결

app.use(cors(corsOptions));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
