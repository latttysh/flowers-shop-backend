import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel from './models/User.js';
import CardModel from './models/Card.js';

const app = express();

app.use(express.json());

mongoose
  .connect('mongodb://localhost:27017/flowerShop')
  .then(() => console.log('YEAH'))
  .catch(() => console.log('fuck i got error'));

app.use(cors());

app.get('/hello', (req, res) => {
  res.json({
    message: 'Hello',
  });
});

app.post('/register', async (req, res) => {
  try {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const doc = new UserModel({
      email: req.body.email,
      name: req.body.name,
      passwordHash,
    });

    const user = await doc.save();

    const token = jwt.sign(
      {
        _id: user._id,
      },
      'SecretKey',
      {
        expiresIn: '30d',
      },
    );

    res.json({ ...user._doc, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Произошла ошибка при регистрации',
      error: error,
    });
  }
});

app.post('/login', async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email }); // Try to find email in db
    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден',
      });
    }

    const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash); // compare two crypt passwords
    if (!isValidPass) {
      return res.status(404).json({
        message: 'Пароль не верный',
      });
    }

    const token = jwt.sign(
      // create jwt
      {
        _id: user._id,
      },
      'secret123',
      {
        expiresIn: '30d',
      },
    );
    res.json({ ...user._doc, token }); //return user.doc info and jwt token
  } catch (error) {
    res.status(500).json('Не удалось авторизоваться');
  }
});

app.post('/addcard', async (req, res) => {
  try {
    const doc = new CardModel({
      title: req.body.title,
      imageUrl: req.body.imageUrl,
      price: req.body.price,
      type: req.body.type,
      filter: req.body.filter,
    });
    const card = await doc.save();
    res.json(card);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Не удалось создать товар',
    });
  }
});

app.get('/getAll', async (req, res) => {
  try {
    const posts = await CardModel.find().exec(); // search post with relationship "user"
    res.json(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Не удалось получить статьи',
    });
  }
});

app.get('/getOne/:id', async (req, res) => {
  try {
    const postId = req.params.id; //get ID paramets

    CardModel.findOne(
      {
        _id: postId,
      },
      (err, doc) => {
        if (err) {
          return res.status(500).json({
            message: 'Не удалось получить статью',
          });
        }
        if (!doc) {
          return res.status(404).json({
            message: 'Статья не найдена',
          });
        }
        res.json(doc);
      },
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Не удалось получить статьи',
    });
  }
});

app.listen(4444, (err) => {
  if (err) {
    return console.log('Erroooor', err);
  }
  console.log('Damn');
});
