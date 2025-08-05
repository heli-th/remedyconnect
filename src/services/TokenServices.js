const jwt =require( "jsonwebtoken");

const createToken = (email, key) => {
  let token = jwt.sign(
    { email },
    key,

    { expiresIn: "14d" }
  );
  return token;
};
const 
verifyToken = async (token, key) => {
  let tokenCheck=false
  jwt.verify(
    
    token,
    key,
    function (err, decoded) {
      if (err) {
        console.log(err);
        return false
        // return tokenCheck
        // return res.send(RESTRESPONSE(false, "token expired", { token: false }));
      } else {
        // console.log("token true");
        // tokenCheck=true
        // console.log(tokenCheck);
        return false;

        
      }
    }
  );
};

module.exports = { createToken,verifyToken };
