var _ = require('underscore')._;

_.mixin({
    merge: function (obj) {
        arguments[0] = this.clone(obj);
        return this.extend.apply(this, arguments);
    }
});

var Table = function (name) {
    this._name = name;
    this._selects = ['*'];
    this._conditions = [];
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

Table.prototype.toSql = function () {
    // This code is only a quick & dirty mockup :) 
    
    var selects = 'select '+this._selects.join(', ');
    
    var from = 'from '+this._name;
    
    var wheres = this._conditions.map(function (condition) {
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
    }).join(' and ');
    
    if (!_.isEmpty(wheres)) {
        wheres = 'where ' + wheres;
    }
    
    var order = this._order ? 'order by '+this._order : null;
    
    var limit = this._limit ? 'limit ' + this._limit : null;
    var offset = this._offset ? 'offset ' + this._offset : null;
    
    return _([selects, from, wheres, order, limit, offset]).reject(_.isEmpty).join(' ');
};

Table.prototype.select = function (name) {
    return _(this).merge({ _selects: Array.prototype.slice.call(arguments) });
};

Table.prototype.limit = function (limit) {
    return _(this).merge({ _limit: limit });
};

Table.prototype.offset = function (offset) {
    return _(this).merge({ _offset: offset });
};

Table.prototype.where = function (condition) {
    if (arguments.length > 1) {
        condition = Array.prototype.slice.call(arguments);
    }
    return _(this).merge({ _conditions: this._conditions.concat([condition]) });
};

Table.prototype.order = function (order) {
    return _(this).merge({ _order: order });
};

exports.table = function (name) {
    return new Table(name);
};