/** 
*@swagger
*components:
*  schemas:
*    User:
*      type: object
*      required:    
*        - name
*        - email
*        - password
*      properties:
*        id:
*          type: string
*          description: The auto-generated id of the user
*        name:
*          type: string
*          description: The user's name
*        email:
*          type: string
*          description: The user's email
*        password:
*          type: string
*          description: The user's password
*      example:
*        name: John Doe
*        email: john@domain.com
*        password: 123456

*/

/**
 * @swagger
 * tags:
 *  name: Users
 * description: The users managing API
*/

/**
 * @swagger
 * /api/auth/register:
 *  post:
 *      summary: Register a new user
 *      tags: [Users]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/User'
 *      responses:
 *          200:
 *              description: The user was successfully registered
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/User'
 *          400:
 *              description: Some required fields are missing
 *          401:
 *              description: Invalid credentials
 *          500:
 *              description: Internal server error
 */