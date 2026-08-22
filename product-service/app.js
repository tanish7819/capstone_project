const express = require("express")
const mysql = require("mysql2")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cors())

const db = mysql.createConnection({
  host: "mysql",
  user: "root",
  password: "password",
  database: "ecommerce"
})

app.get("/products",(req,res)=>{
  db.query("SELECT * FROM products",(err,result)=>{
    if(err) {
      console.error(err)
      return res.status(500).json({error:"Database error"})
    }

    res.json(result)
  })
})

app.post("/products",(req,res)=>{
  const {name,price,stock}=req.body

  db.beginTransaction((err)=>{
    if(err) {
      console.error(err)
      return res.status(500).json({error:"Transaction failed"})
    }

    db.query(
      "INSERT INTO products(name,price,stock) VALUES (?,?,?)",
      [name,price,stock],
      (err,result)=>{
        if(err) {
          return db.rollback(()=>{
            console.error(err)
            res.status(500).json({error:"Failed to create product"})
          })
        }

        const productId = result.insertId

        db.query(
          "INSERT INTO inventory(product_id,stock) VALUES (?,?)",
          [productId,stock],
          (err)=>{
            if(err) {
              return db.rollback(()=>{
                console.error(err)
                res.status(500).json({
                  error:"Failed to create inventory"
                })
              })
            }

            db.commit((err)=>{
              if(err) {
                return db.rollback(()=>{
                  console.error(err)
                  res.status(500).json({
                    error:"Failed to commit transaction"
                  })
                })
              }

              res.json({
                message:"product created",
                productId:productId
              })
            })
          }
        )
      }
    )
  })
})

app.delete("/products/:id",(req,res)=>{
  const productId = req.params.id

  db.beginTransaction((err)=>{
    if(err) {
      console.error(err)
      return res.status(500).json({error:"Transaction failed"})
    }

    // Delete inventory record first
    db.query(
      "DELETE FROM inventory WHERE product_id=?",
      [productId],
      (err)=>{
        if(err) {
          return db.rollback(()=>{
            console.error(err)
            res.status(500).json({
              error:"Failed to delete inventory"
            })
          })
        }

        // Delete product record
        db.query(
          "DELETE FROM products WHERE id=?",
          [productId],
          (err,result)=>{
            if(err) {
              return db.rollback(()=>{
                console.error(err)
                res.status(500).json({
                  error:"Failed to delete product"
                })
              })
            }

            // Check whether product existed
            if(result.affectedRows === 0) {
              return db.rollback(()=>{
                res.status(404).json({
                  error:"Product not found"
                })
              })
            }

            db.commit((err)=>{
              if(err) {
                return db.rollback(()=>{
                  console.error(err)
                  res.status(500).json({
                    error:"Failed to commit transaction"
                  })
                })
              }

              res.json({
                message:"Product and inventory deleted",
                productId:productId
              })
            })
          }
        )
      }
    )
  })
})
app.listen(5000,()=>console.log("product service running"))
