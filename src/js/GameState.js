export default class GameState {
  static from(object) {
    // TODO: create object
    if (object && typeof object === "object"){
      return object;
    }
    return null;
  }
}
