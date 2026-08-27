
const express=require("express")
const mysql=require("mysql2")
const cors=require("cors")

const app=express()
app.use(express.json())
app.use(cors())

const db=mysql.createConnection({
 host:"mysql",
 user:"root",
 password:"password",
 database:"ecommerce"
})

app.get("/orders",(req,res)=>{
 db.query("SELECT * FROM orders",(err,result)=>{
   if(err) throw err
   res.json(result)
 })
})

app.post("/orders",(req,res)=>{
 const {product_id,quantity}=req.body

 if(!product_id || !quantity || quantity <= 0) {
   return res.status(400).json({
     error:"product_id and a valid quantity are required"
   })
 }

 db.beginTransaction((err)=>{
   if(err) {
     console.error(err)
     return res.status(500).json({
       error:"Transaction failed"
     })
   }

   // Check current inventory
   db.query(
     "SELECT stock FROM inventory WHERE product_id=? FOR UPDATE",
     [product_id],
     (err,result)=>{
       if(err) {
         return db.rollback(()=>{
           console.error(err)
           res.status(500).json({
             error:"Failed to check inventory"
           })
         })
       }

       if(result.length === 0) {
         return db.rollback(()=>{
           res.status(404).json({
             error:"Product inventory not found"
           })
         })
       }

       const currentStock = result[0].stock

       // Check sufficient stock
       if(currentStock < quantity) {
         return db.rollback(()=>{
           res.status(400).json({
             error:"Insufficient stock",
             availableStock:currentStock,
             requestedQuantity:quantity
           })
         })
       }

       const newStock = currentStock - quantity

       // Reduce inventory
       db.query(
         "UPDATE inventory SET stock=? WHERE product_id=?",
         [newStock,product_id],
         (err)=>{
           if(err) {
             return db.rollback(()=>{
               console.error(err)
               res.status(500).json({
                 error:"Failed to update inventory"
               })
             })
           }

           // Create order
           db.query(
             "INSERT INTO orders(product_id,quantity,status) VALUES (?,?,?)",
             [product_id,quantity,"CREATED"],
             (err,result)=>{
               if(err) {
                 return db.rollback(()=>{
                   console.error(err)
                   res.status(500).json({
                     error:"Failed to create order"
                   })
                 })
               }

               db.commit((err)=>{
                 if(err) {
                   return db.rollback(()=>{
                     console.error(err)
                     res.status(500).json({
                       error:"Failed to commit order"
                     })
                   })
                 }

                 res.json({
                   message:"order created",
                   order_id:result.insertId,
                   product_id:product_id,
                   quantity:quantity,
                   remainingStock:newStock
                 })
               })
             }
           )
         }
       )
     }
   )
 })
})

// Delete Order
app.delete("/orders/:id",(req,res)=>{
  const orderId = req.params.id

  db.query(
    "DELETE FROM orders WHERE id=?",
    [orderId],
    (err,result)=>{
      if(err){
        console.error(err)
        return res.status(500).json({
          error:"Failed to delete order"
        })
      }

      if(result.affectedRows === 0){
        return res.status(404).json({
          error:"Order not found"
        })
      }

      res.json({
        message:"Order deleted successfully",
        orderId:orderId
      })
    }
  )
})

app.listen(5001,()=>console.log("order service running"))
