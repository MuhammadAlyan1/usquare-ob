// @ts-ignore
function reducer(state, action) {
  switch (action.type) {
    case "SIGN_IN": {
      const userId = action.payload;

      if (!userId) {
        throw new Error("Please provide userId to set current user");
      }

      return {
        ...state,
        userId,
      };
    }

    case "SIGN_OUT": {
      return {
        ...state,
        userId: null,
      };
    }

    default:
      return state;
  }
}

export default reducer;
