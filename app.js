const express = require('express');
const socket = require('socket.io');
const http = require('http');
const {Chess} = require('chess.js');
const path = require('path');


const app = express();
const server = http.createServer(app);
const io = socket(server);


const chess = new Chess();

let players = {};
let currentPlayer = null;


app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname,"public")));


app.get("/", (req, res)=>{
    res.render('index', {title: 'Chess Game'})
});

io.on("connection", (uniqueSocket)=>{
    console.log("connection established");
    
    //Check Plays is present or not
    if(!players.white){
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "w");
    }else if(!players.black){
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "b");
    }else{
        uniqueSocket.emit("spectatorRole");
    }

    uniqueSocket.on("disconnect",()=>{
        if(uniqueSocket.id === players.white){
            delete players.white;
        }
        else if(uniqueSocket.id === players.black){
            delete players.black;
        }
    });

    uniqueSocket.on("move", (move)=>{
        try {
            if(chess.turn() === "w" && uniqueSocket.id !== players.white) return;
            if (chess.turn() === "b" && uniqueSocket.id !== players.black) return;


            const result = chess.move(move);
            if(result){
                currentPlayer =  chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            }else{
                console.log("Error in moving the chess board ", move);
                uniqueSocket.emit("invalidMove", move);
                
            }
            
        } catch (error) {
            console.log(error);
            
            uniqueSocket.emit("Invalid move", move);
            
        }
    })
})


server.listen(3000, ()=>{
    console.log("server listening on port 3000");
    
});

