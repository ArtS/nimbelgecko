if (typeof Array.isArray === "undefined") {
    Array.prototype.isArray = function(self) {
        return Object.prototype.toString.call(self) === "[object Array]";
    };
}
