function requireActionToken(req, res) {
  var expected = process.env.TUTOR_ACTION_TOKEN;
  var supplied = req.headers.authorization || '';
  if (!expected || supplied !== 'Bearer ' + expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

async function supabase(path, options) {
  var url = process.env.SUPABASE_URL;
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Tutor service is not configured.');
  var response = await fetch(url + '/rest/v1/' + path, Object.assign({
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }
  }, options || {}));
  if (!response.ok) throw new Error('Database request failed (' + response.status + ').');
  return response.status === 204 ? null : response.json();
}

function requiredString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(name + ' is required.');
  return value.trim();
}

module.exports = { requireActionToken: requireActionToken, supabase: supabase, requiredString: requiredString };
