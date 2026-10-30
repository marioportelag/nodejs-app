export interface User {
  id: number;
  name: string;
  age: number;
}

/** In-memory, read-only sample data. Stands in for a persistence layer. */
const users: readonly User[] = Object.freeze([
  { id: 25, name: 'camilo', age: 28 },
  { id: 26, name: 'juan', age: 32 },
]);

export const userStore = {
  findAll(): readonly User[] {
    return users;
  },

  findById(id: number): User | undefined {
    return users.find((user) => user.id === id);
  },
};
