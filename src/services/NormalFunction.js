const moment = require('moment')
const getDifferenceBetweenTwoDates = (date1,date2)=>{
    console.log(date1,date2)
    var days = moment(date1).diff(moment(date2), 'minutes');
    return Math.abs(days);

}
module.exports={getDifferenceBetweenTwoDates}