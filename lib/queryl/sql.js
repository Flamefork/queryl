var _ = require('underscore')._;

_.mixin({
    merge: function (obj) {
        arguments[0] = this.clone(obj);
        return this.extend.apply(this, arguments);
    },
    toArray: function (obj) {
        return Array.prototype.slice.call(obj)
    }
});

// This code is only a quick & dirty mockup to make existing tests pass :) 

var Table = function (name) {
    this._table = name;
    this._name = name;
    this._selects = ['*'];
    this._joins = [];
    this._wheres = [];
    this._group = null;
    this._havings = [];
    this._order = null;
    this._limit = null;
    this._offset = null;
};

function pad(n){ return n < 10 ? '0'+n : n }

function formatDate(d) {
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
}

function quote(value) {
    if (_.isBoolean(value) || _.isNumber(value)) {
        return value;
    }
    if (_.isDate(value)) {
        return '\''+formatDate(value)+'\'';
    }
    return '\''+(''+value).replace(/'/g, "\\'")+'\'';
}

function mapCondition(condition) {
    if (_.isString(condition)) {
        return condition;
    }
            
    if (_.isArray(condition)) {
        return condition.shift().replace(/(.)?\?/g, function ($0, $1) {
            if ($1 == '\\') return '?';
            return ($1 || '') + quote(condition.shift());
        });
    }
            
    return _.map(condition, function (value, key) {
        if (_.isArray(value)) {
            return key+' in ('+value.map(quote).join(', ')+')';
        }
                
        if (_.isNull(value)) {
            return key+' is null';
        }
                
        return key+' = '+quote(value);
    }).join(' and ');
}

function mapJoinCondition(condition, targetTable, joinTable) {
    if (_.isString(condition)) {
        return condition;
    }
            
    return _.map(condition, function (value, key) {
        return joinTable._name+'.'+key+' = '+targetTable._name+'.'+value;
    }).join(' and ');
}

function aliasedTable(table) {
    var alias = table._table != table._name ? ' as '+table._name : '';
    return table._table+alias;
}

Table.prototype.toSql = function () {
    var selects = 'select '+this._selects.join(', ');
    
    var from = 'from '+aliasedTable(this);
    
    var joins = _.isEmpty(this._joins) ? null : this._joins.map(function (join) {
        var source = join.table.isPureSelect() ? aliasedTable(join.table) : '('+join.table.toSql()+') '+join.table._name;
        var condition = join.condition ? ' on '+mapJoinCondition(join.condition, this, join.table) : '';
        return join.type+' join '+source+condition;
    }, this).join(', ');
    
    var wheres = _.isEmpty(this._wheres) ? null : 'where ' + this._wheres.map(mapCondition).join(' and ');
    
    var group = this._group ? 'group by '+this._group : null;
    
    var havings = _.isEmpty(this._havings) ? null : 'having ' + this._havings.map(mapCondition).join(' and ');
    
    var order = this._order ? 'order by '+this._order : null;
    
    var limit = this._limit ? 'limit ' + this._limit : null;
    
    var offset = this._offset ? 'offset ' + this._offset : null;
    
    return _([selects, from, joins, wheres, group, havings, order, limit, offset]).reject(_.isEmpty).join(' ');
};

Table.prototype.isPureSelect = function () {
    var isSelectAll = this._selects.length == 1 && this._selects[0] == '*';
    return [
        this._joins,
        this._wheres,
        this._group,
        this._havings,
        this._order,
        this._limit,
        this._offset
    ].every(_.isEmpty) && isSelectAll;
};

Table.prototype.select = function (name) {
    return _(this).merge({ _selects: _.toArray(arguments) });
};

Table.prototype.as = function (alias) {
    return _(this).merge({ _name: alias });
};

Table.prototype.limit = function (limit) {
    return _(this).merge({ _limit: limit });
};

Table.prototype.offset = function (offset) {
    return _(this).merge({ _offset: offset });
};

Table.prototype.where = function (condition) {
    if (arguments.length > 1) {
        condition = _.toArray(arguments);
    }
    return _(this).merge({ _wheres: this._wheres.concat([condition]) });
};

Table.prototype.order = function (by) {
    return _(this).merge({ _order: by });
};

Table.prototype.group = function (by) {
    return _(this).merge({ _group: by });
};

Table.prototype.having = function (condition) {
    if (arguments.length > 1) {
        condition = _.toArray(arguments);
    }
    return _(this).merge({ _havings: this._havings.concat([condition]) });
};

Table.prototype.leftJoin = function (table, condition) {
    return _(this).merge({ _joins: this._joins.concat([{
        type: 'left',
        table: table,
        condition: condition
    }]) });
};

exports.table = function (name) {
    return new Table(name);
};