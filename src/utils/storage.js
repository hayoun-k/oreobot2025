export async function getMemberData(kv, userId) {
  try {
    const data = await kv.get(`member:${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting member data:', error);
    return null;
  }
}

export async function setMemberData(kv, userId, data) {
  try {
    await kv.put(`member:${userId}`, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error setting member data:', error);
    return false;
  }
}

export async function getAllMembers(kv) {
  try {
    const list = await kv.list({ prefix: 'member:' });
    const members = [];
    
    for (const key of list.keys) {
      const data = await kv.get(key.name);
      if (data) {
        members.push(JSON.parse(data));
      }
    }
    
    return members;
  } catch (error) {
    console.error('Error getting all members:', error);
    return [];
  }
}