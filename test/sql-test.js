var vows = require('vows'),
    assert = require('assert'),
    sql = require('../lib/queryl/sql');

vows.describe('sql').addBatch({
    'SQL builder': {
        'when created for table \'posts\'': sqlVow({
            topic: sql.table('posts'),
            sql: "select * from posts"
        }),
        'when created for table \'users\'': sqlVow({
            topic: sql.table('users'),
            sql: "select * from users",
            
            'as \'superheroes\'': sqlVow({
                topic: function (table) { return table.as('superheroes'); },
                sql: "select * from users as superheroes"
            }),
            
            'with limit': sqlVow({
                topic: function (table) { return table.limit(10); },
                sql: "select * from users limit 10"
            }),
            
            'with offset': sqlVow({
                topic: function (table) { return table.offset(20); },
                sql: "select * from users offset 20",
                
                'combined with limit': sqlVow({
                    topic: function (table) { return table.limit(30); },
                    sql: "select * from users limit 30 offset 20"
                })
            }),
            
            'with simple hash condition': sqlVow({
                topic: function (table) { return table.where({login: 'admin'})},
                sql: "select * from users where login = 'admin'",
                
                'combined with another one': sqlVow({
                    topic: function (table) { return table.where({active: true}); },
                    sql: "select * from users where login = 'admin' and active = true"
                })
            }),
            
            'with hash condition with null value': sqlVow({
                topic: function (table) { return table.where({status: null})},
                sql: "select * from users where status is null"
            }),
            
            'with string condition': sqlVow({
                topic: function (table) { return table.where("login = 'admin'")},
                sql: "select * from users where login = 'admin'"
            }),
            
            'with string interpolation condition': sqlVow({
                topic: function (table) { return table.where('login = ? and power > ?', 'admin', 9000)},
                sql: "select * from users where login = 'admin' and power > 9000"
            }),
            
            'with escaped string interpolation condition': sqlVow({
                topic: function (table) { return table.where("sign = '\\?' and login = ?", 'admin')},
                sql: "select * from users where sign = '?' and login = 'admin'"
            }),
            
            'with array condition': sqlVow({
                topic: function (table) { return table.where({login: ['admin', 'admin2']})},
                sql: "select * from users where login in ('admin', 'admin2')"
            }),
            
            'with numeric condition': sqlVow({
                topic: function (table) { return table.where({power: 9000})},
                sql: "select * from users where power = 9000"
            }),
            
            'with date condition': sqlVow({
                topic: function (table) {
                    return table.where({createdAt: new Date('2010-12-01UTC')})},
                sql: "select * from users where createdAt = '2010-12-01'"
            }),
            
            'with quotes': sqlVow({
                topic: function (table) {
                    return table.where({login: "ha'ha'ha"})},
                sql: "select * from users where login = 'ha\\'ha\\'ha'"
            }),
            
            'with selected column': sqlVow({
                topic: function (table) { return table.select('login')},
                sql: "select login from users"
            }),
            
            'with ordering': sqlVow({
                topic: function (table) { return table.order('login desc')},
                sql: "select * from users order by login desc"
            }),
            
            'with grouping': sqlVow({
                topic: function (table) { return table.group('role')},
                sql: "select * from users group by role",
                
                'and having clause': sqlVow({
                    topic: function (table) { return table.having({role: 'admin'})},
                    sql: "select * from users group by role having role = 'admin'"
                })
            }),
            
            'with subselect': sqlVow({
                topic: function (table) { return table.select('login', sql.table('comments').where('user_id = users.id').select('count(*)').as('comment_count'))},
                sql: "select login, (select count(*) from comments as comment_count where user_id = users.id) comment_count from users"
            }),
            
            'with left-joined \'comments\' table with hash condition': sqlVow({
                topic: function (table) { return table.leftJoin(sql.table('comments'), {user_id: 'id'})},
                sql: "select * from users left join comments on comments.user_id = users.id"
            }),
            
            'with left-joined \'comments\' table with string condition': sqlVow({
                topic: function (table) { return table.leftJoin(sql.table('comments'), 'comments.user_id = users.id')},
                sql: "select * from users left join comments on comments.user_id = users.id"
            })
        }),
        
        'when created for complex query': sqlVow({
            topic: sql.table('users').
                as('superheroes').
                select(
                    'login as codename',
                    'speeches.count',
                    sql.table('kills').
                        where('user_id = users.id').
                        select('count(*)').
                        as('kill_count')).
                where({alive: true}).
                where('power > ? and birthDate < ?', 9000, new Date('1900-01-01UTC')).
                leftJoin(
                    sql.table('comments').
                        as('speeches'),
                    {user_id: 'id'}).
                leftJoin(
                    sql.table('users').
                        as('victims').
                        where({alive: false}),
                    {killed_by_id: 'id'}).
                group('role').
                having({role: ['savior', 'enemy']}).
                order('power desc').
                limit(100),
            sql: "select login as codename, speeches.count, " +
                 "(select count(*) from kills as kill_count where user_id = users.id) kill_count " +
                 "from users as superheroes " +
                 "left join comments as speeches on speeches.user_id = superheroes.id, " +
                 "left join (select * from users as victims where alive = false) victims on victims.killed_by_id = superheroes.id " +
                 "where alive = true and power > 9000 and birthDate < '1900-01-01' " +
                 "group by role having role in ('savior', 'enemy') order by power desc limit 100"
        })
    }
}).export(module);

// Maps sql property to appropriate vow function
function sqlVow(o) {
    var sql = o.sql;
    delete o.sql;
    o['should produce "'+sql+'"'] = function (topic) {
        assert.equal(topic.toSql(), sql);
    };
    return o;
}
