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
            })
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

function todo() {
    sql.table('users').
        leftJoin(
            sql.table('comments'),
            {id: 'user_id'}).
        select(
            'login',
            'comments.text',
            {likes: sql.table('stats').
                select('counter').
                where({comment_id: 'comments.id'})});
}