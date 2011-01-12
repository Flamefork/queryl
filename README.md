### Queryl

Database query interface for node.js

## Status

Very early stage, nothing practical yet.

See/try tests if you want to check progress.  

## Usage examples (subject to change)

    // select * from users where active = true and power > 9000
    // and type in ('admin, 'moderator') and expires > now() limit 1
    table('users').
        where({active: true}).
        where('power > ?', 9000).
        where({type: ['admin', 'moderator']}).
        where('expires > now()').
        first(function (row) {});
    
    var Users = table('users');
    
    Users.active = Users.where({active: true});
    
    // select users.login from users where active = true
    Users.active.
        select('login').
        all(function (rows) {});
    
    // select users.login, comments.text, (select counter from stats where
    // comment_id = comments.id) as likes from users left join comments on
    // users.id = comments.user_id order by last_logged_in desc limit 20 offset 20
    Users.
        order('last_logged_in desc').
        leftJoin(
            table('comments'),
            {id: 'user_id'}).
        select(
            'login',
            'comments.text',
            {likes: table('stats').
                select('likes').
                where({comment_id: 'comments.id'})}).
        limit(20, 20).
        all(function (rows) {});
    
    // select * from users where id = 123
    Users.find(123, function (row) {});
    
    // insert into users (login, active) values ('flameork', false)
    Users.insert({
        login: 'flameork',
        active: false
    }, function (id) {});
    
    // update users set active = false
    Users.update({
        active: false
    }, function (updatedRows) {});
    
    // update users set login = 'flamefork', active = true where id = 123
    Users.where({id: 123}).update({
        login: 'flamefork',
        active: true
    }, function (updatedRows) {});

## TBD

- GROUP BY
- API for OR in conditions
- Non SQL-92 stuff like hierarchical queries etc