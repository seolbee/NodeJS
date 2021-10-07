const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const indexRouter = require('./routes');
const userRouter = require('./routes/user');

const upload = multer({
    storage:multer.diskStorage({
        destination(req, file, done) {
            done(null, 'upload/');
        },
        filename(req, file, done){
            const ext = path.extname(file.originalname);
            done(null, path.basename(file.originalname, ext) + Date.now() + ext);
        }
    }),
    limits:{fileSize : 5 * 1024 * 1024}
});

dotenv.config();
const app = express();
app.set('port', process.env.PROT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(morgan('dev'));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({extended : false}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave:false,
    saveUninitialized : false,
    secret:process.env.COOKIE_SECRET,
    cookie:{
        httpOnly : true,
        secure : false
    },
    name:'session-cookie'
}));

app.use((req, res, next)=> {
    console.log('모든 요청에 다 실행됩니다.');
    next();
})

app.use('/', indexRouter);
app.use('/user', userRouter);

// app.post('/upload', upload.single('image'), (req, res)=> {
//     console.log(req.files, req.body);
//     res.send('ok');
// });

// app.post('/upload', upload.array('image'), (req, res)=> {
//     console.log(req.files, req.body);
//     res.send('ok');
// });

app.post('/upload', upload.fields([{name:'image1'}, {name:'image2'}]), (req, res)=> {
    console.log(req.files, req.body);
    res.send('ok');
});

app.use((err, req, res, next) => {
    console.log(err);
    res.statue(500).send(err.message);
})

app.listen(app.get('port'), ()=> {
    console.log(app.get('port'), '번 포트에서 대기중');
});

try {
    fs.readdirSync('upload');
} catch (error) {
    console.error('upload 폴더가 없어 upload 폴더를 생성합니다.');
    fs.mkdirSync('upload')
}