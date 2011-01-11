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
            
            'with string condition': sqlVow({
                topic: function (table) { return table.where("login = 'admin'")},
                sql: "select * from users where login = 'admin'"
            }),
            
            'with in array condition': sqlVow({
                topic: function (table) { return table.where({login: ['admin', 'admin2']})},
                sql: "select * from users where login in ('admin', 'admin2')"
            }),
            
            'with selected column': sqlVow({
                topic: function (table) { return table.select('login')},
                sql: "select login from users"
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
    where({'last_logged_in >': new Date(2010, 12, 1)}).
    order('last_logged_in desc').
    leftJoin(
        table('comments'),
        {id: 'user_id'}).
    select('login', 'comments.text');
}