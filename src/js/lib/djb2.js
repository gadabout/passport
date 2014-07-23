function djb2Code(str){
  var hash = 5381;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
  }
  return hash;
}

module.exports = djb2Code;
