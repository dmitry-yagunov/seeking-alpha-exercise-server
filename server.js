const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'Dima',
    password : '',
    database : 'seeking-alpha'
  }
});

db.select('*').from('users')
	.then(data => {
		console.log(data);
	})

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/users', (req, res) => {
	let usersFollowers = 
	db.select("user_id_following as user_id")
  		.count("* as total_followers")
  		.from("following")
  		.groupBy("user_id_following")
  		.as("user_followers");

	db.select('users.name as user_name')
		.select('users.user_id as user_id')
		.select('users.group_id as group_id')
		.select('groups.name as group_name')
		.select('user_followers.total_followers as total_followers')
		.from('users')
		.leftJoin('groups', 'users.group_id', 'groups.group_id')
		.leftJoin(usersFollowers, 'user_followers.user_id', 'users.user_id')
		.orderBy('users.name')
		.then(users => {
			res.json(users)
		})
	.catch(err => res.status(400).json('Error: '+err))
});

app.post('/signin', (req, res) => {
	let usersFollowers = 
	db.select("user_id")
  		.count("* as total_followers")
  		.from("following")
  		.where('following.user_id', '=', req.body.id)
  		.groupBy("user_id")
  		.as("user_followers");

	db.select('users.name as user_name')
		.select('users.user_id as user_id')
		.select('users.group_id as group_id')
		.select('groups.name as group_name')
		.select('user_followers.total_followers as total_followers')
		.from('users')
		.leftJoin('groups', 'users.group_id', 'groups.group_id')
		.leftJoin(usersFollowers, 'user_followers.user_id', 'users.user_id')
		.where('users.user_id', '=', req.body.id)
		.then(data => {
			if (data.length) {
				res.json(data[0])
			}
			else{
				res.status(400).json('Not Found')
			}
		})
	.catch(err => res.status(400).json('Error: '+err))
})

app.post('/follow', (req, res) => {
	const { user_id, user_id_following } = req.body;
	
	db.insert({
		user_id: user_id,
		user_id_following: user_id_following
	})
	.into('following')
	.then(res.json("OK"))
	.catch(err => res.status(400).json('Unable to follow ' + err))
});

app.post('/unfollow', (req, res) => {
	const { user_id, user_id_following } = req.body;
	
	db('following')
		.where('user_id', user_id)
		.andWhere('user_id_following', user_id_following)
		.del()
	.then(res.json("OK"))
	.catch(err => res.status(400).json('Unable to unfollow ' + err))
});

app.post('/followers', (req, res) => {
	const { userId } = req.body;
	
	db.select('user_id_following').from('following')
		.where('user_id', '=', userId)
		.then(users => {
			res.json(users)
		})
	.catch(err => res.status(400).json('Error: '+ err))
});

app.listen(3001, () => {
	console.log('====RUNNING=====');
});