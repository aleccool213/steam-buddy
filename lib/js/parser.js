import { parseString } from 'xml2js';

class Parser {
  parse(xml, callback){
    let userId = null;
    return parseString(xml, function(err, result){
      if( result && result.profile ) {
        let steamId64Bit = result.profile.steamID64[0];
        let steamID = result.profile.steamID[0];
        if( !err ) {
          return callback(null, {name: steamID, id: steamId64Bit});
        }
      }
    });
  }
}

export default Parser;
