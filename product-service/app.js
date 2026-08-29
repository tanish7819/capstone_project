const express = require("express")
const mysql = require("mysql2")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cors())

const db = mysql.createPool({
  host: "mysql",
  user: "root",
  password: "password",
  database: "ecommerce"
})

// Get all products
app.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, result) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Database error" })
    }

    res.json(result)
  })
})

// Add product
app.post("/products", (req, res) => {
  const { name, price, stock } = req.body

  db.getConnection((err, connection) => {
    if (err) {
      console.error(err)
      return res.status(500).json({
        error: "Database connection failed"
      })
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release()
        console.error(err)
        return res.status(500).json({
          error: "Transaction failed"
        })
      }

      connection.query(
        "INSERT INTO products(name,price,stock) VALUES (?,?,?)",
        [name, price, stock],
        (err, result) => {
          if (err) {
            return connection.rollback(() => {
              connection.release()
              console.error(err)
              res.status(500).json({
                error: "Failed to create product"
              })
            })
          }

          const productId = result.insertId

          connection.query(
            "INSERT INTO inventory(product_id,stock) VALUES (?,?)",
            [productId, stock],
            (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release()
                  console.error(err)
                  res.status(500).json({
                    error: "Failed to create inventory"
                  })
                })
              }

              connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release()
                    console.error(err)
                    res.status(500).json({
                      error: "Failed to commit transaction"
                    })
                  })
                }

                connection.release()

                res.json({
                  message: "Product created successfully",
                  productId: productId
                })
              })
            }
          )
        }
      )
    })
  })
})

// Delete product
app.delete("/products/:id", (req, res) => {
  const productId = req.params.id

  db.getConnection((err, connection) => {
    if (err) {
      console.error(err)
      return res.status(500).json({
        error: "Database connection failed"
      })
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release()
        console.error(err)
        return res.status(500).json({
          error: "Transaction failed"
        })
      }

      // Delete inventory first
      connection.query(
        "DELETE FROM inventory WHERE product_id=?",
        [productId],
        (err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release()
              console.error(err)
              res.status(500).json({
                error: "Failed to delete inventory"
              })
            })
          }

          // Delete product
          connection.query(
            "DELETE FROM products WHERE id=?",
            [productId],
            (err, result) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release()
                  console.error(err)
                  res.status(500).json({
                    error: "Failed to delete product"
                  })
                })
              }

              if (result.affectedRows === 0) {
                return connection.rollback(() => {
                  connection.release()
                  res.status(404).json({
                    error: "Product not found"
                  })
                })
              }

              connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release()
                    console.error(err)
                    res.status(500).json({
                      error: "Failed to commit transaction"
                    })
                  })
                }

                connection.release()

                res.json({
                  message: "Product and inventory deleted successfully",
                  productId: productId
                })
              })
            }
          )
        }
      )
    })
  })
})

app.listen(5000, () => {
  console.log("product service running")
})