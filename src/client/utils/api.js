export const parseJson = async (res) => {
  try {
    return await res.json();
  } catch (err) {
    return null;
  }
};
