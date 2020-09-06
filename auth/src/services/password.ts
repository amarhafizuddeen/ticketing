import bcrypt from 'bcryptjs'

const saltRounds = 10

export class Password {
  static async toHash(password: string) {
    return bcrypt.hashSync(password, saltRounds)
  }

  static async compare(storedPassword: string, suppliedPassword: string) {
    return bcrypt.compareSync(suppliedPassword, storedPassword)
  }
}
