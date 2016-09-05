var stream = require('stream');
var util = require('util');
var Transform = stream.Transform;
var i = 0;
var ctr = 0;

function Filter(filterProps, options){
    if(!(this instanceof Filter)){
        return new Filter(filterProps, options);
    }
    
    Transform.call(this, options);
    this.filterProps = filterProps;
}

util.inherits(Filter, Transform);

Filter.prototype._transform = function(obj, enc, cb){
    
    var self = this;
    var filteredKeys = Object.keys(obj).filter(function(key){
        return (self.filterProps.indexOf(key) === -1);
    });

    var filteredObj = filteredKeys.reduce(function(accum, key){
       accum[key] = obj[key];
       return accum;
    },
    {}
    );
    // console.log(filteredObj);
    // console.log('random');
    this.push(filteredObj);
    cb();
}

module.exports = Filter;