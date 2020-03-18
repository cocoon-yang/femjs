'use strict';
// 0.1.2 -- After solve global stiffness equations, calculating global force vector
// 0.1.3 -- Adding barStress method
// const fs = require('fs');   
// var numeric = require("numeric");  

var fem = (typeof exports === "undefined")?(function fem() {}):(exports);
if(typeof global !== "undefined") { global.fem = fem; }
    fem._precision = 2;
    fem._model;
    fem._jsonFileSource ;

    fem._globalDOF = 0; 

    fem._globalStiffMatrix = [];
    fem._oriGlobalStiffnessMatrix;
    fem._F = [];
    fem._U = [];

    // Checking whether an js object is valid
    fem.checkingObject = function( targetObj )
    {
        var result = true;  
        if( typeof targetObj == 'undefined' ) {
            console.log("checkingObject(): undefined Object");
            result = false;
        }
    
        if( typeof targetObj === "" ) {
            console.log("checkingObject(): Object is empty");  
            result = false;
        }
        return result;
    }

    fem.show = function( str )
    {
        var result = document.getElementById('content').innerHTML;
         result += "<pre>" + str + "</pre>" ;
        document.getElementById("content").innerHTML = result;
    }

    fem.showMatrix = function( theMatrix )   
    { 
        var self = this; 

        var tmp = "";
        var dim = numeric.dim( theMatrix );

        var len = dim.length; 
        if( parseInt(len) == 1 )
        {
            len = dim[0];
            for(var j = 0; j <  parseInt(len) - 1; j++){
                tmp += String((theMatrix[j]).toFixed(self._precision)) + "\t";
            }
            tmp += String((theMatrix[parseInt(len)-1]).toFixed(self._precision)) 
            self.show( tmp );     
            return;       
        }

        // console.log(dim); 

        for(var i = 0; i < parseInt(dim[0]); i++){
            tmp = ""; 
            len = parseInt(dim[1])
            for(var j = 0; j <  len - 1; j++){
                tmp += String((theMatrix[i][j]).toFixed(self._precision)) + " ";
            }
            tmp += String((theMatrix[i][len-1]).toFixed(self._precision))
            tmp += "<br/>" ;
            // alert(tmp);
            self.show( tmp );
        }
    }

    // Open FEM model json file
    fem.open = function( filePath )   
    { 
        var self = this; 
        self._jsonFileSource = filePath;
        var fileData = fs.readFileSync(self._jsonFileSource, "utf8");
                    
        self._model = JSON.parse(fileData); 

        //console.log(JSON.stringify( self._model, null, " ")); 
    }

    fem.saveModel = function(){ 
        var self = this; 
        // Updating source file 
        fs.writeFileSync( self._jsonFileSource, JSON.stringify( self._model, null, " "), {"encoding":'utf8'});    
    } 

    fem.showModel = function(){ 
        var self = this; 
        // Updating source file  
        var str = JSON.stringify(self._model);   
        self.show( str );  
    } 


    fem.calcuGlobalDOF = function( )   
    {
        var self = this; 
        for( var nodeID in self._model["nodes"] )
        {
            var dofnum = self._model["nodes"][nodeID]["dofnum"]; 
            self._model["nodes"][nodeID]["dofID"] = self._globalDOF;
            self._globalDOF += parseInt( dofnum );

            //console.log( JSON.stringify( self._model["nodes"][nodeID], null, " ") );
        }
        console.log("globalDOF:", self._globalDOF ); 
        // init _globalStiffMatrix
        for( var i = 0; i < parseInt(self._globalDOF); i++)
        {
            var tmp = [];
            for( var j = 0; j < parseInt(self._globalDOF); j++)
            {
                tmp[j] = 0.0;
            }
            self._globalStiffMatrix[i] = tmp;
        }

        // Init force vector and dispmant vector
        for( var i = 0; i < parseInt(self._globalDOF); i++)
        {
            self._F[parseInt(i)] = 0.0;
            self._U[parseInt(i)] = 0.0;
        }        
    }

    fem.calcuTwoNodeVector = function( nodeID1, nodeID2 )   
    {
        var self = this;            
        var result = self.checkingObject( nodeID1 );  
        if(! Boolean( result ))
        {
            console.error("calcuTwoNodeDistance(): invalid node id");
            return;
        }
        result = self.checkingObject( nodeID2 );  
        if(! Boolean( result ))
        {
            console.error("calcuTwoNodeDistance(): invalid node id");
            return;
        }

        var n_1 = self._model["nodes"][ String(parseInt(nodeID1)) ];
        var n_2 = self._model["nodes"][ String(parseInt(nodeID2)) ];

        var dx = parseFloat(n_2["coords"]["x"]) - parseFloat(n_1["coords"]["x"]);
        var dy = parseFloat(n_2["coords"]["y"]) - parseFloat(n_1["coords"]["y"]);
        var dz = parseFloat(n_2["coords"]["z"]) - parseFloat(n_1["coords"]["z"]);

        var d = [ dx, dy, dz];
        var len = Math.sqrt( d[0]*d[0] + d[1]*d[1] + d[2]*d[2] ); 
        
        var c_alpha = d[0] / len; 
        //s_alpha = Math.sqrt( 1 - c_alpha * c_alpha );
        var c_beta = d[1] / len; 
        //s_beta = Math.sqrt( 1 - c_beta * c_beta );
        var c_gamma = d[2] / len; 

        return [len, c_alpha, c_beta, c_gamma]; 
    }

    // constructing bar element stiffness matrix 
    fem.bar = function( elemID )   
    {
        var self = this;         
        var theElm = self._model["elements"][elemID]; 
        var nodesIDList = theElm["node"]; 
        var area = theElm["area"]; 
        
        var mateType = theElm["material"];
        //console.log("spring mateType:", mateType );

        var material = self._model["materials"][mateType]; 
        var E = parseFloat( material["E"]);  
        var result = self.checkingObject( E );  
        if(! Boolean( result ))
        {
            console.error("bar(): invalid E");
            return;
        }   
        
        var lenVector = self.calcuTwoNodeVector(nodesIDList[0], nodesIDList[1]);
        var len = lenVector[0];
        var k = parseFloat(E) * parseFloat(area) / parseFloat(len) ;
        var K_e = [[ k, -k], [-k, k]];       

        var PM = [
            [lenVector[1], lenVector[2], lenVector[3], 0.0, 0.0, 0.0 ], 
            [0.0, 0.0, 0.0, lenVector[1], lenVector[2], lenVector[3]]
        ];

        var PM_T = numeric.transpose( PM );
        var tmp = numeric.dot( PM_T, K_e ); 

        var K = numeric.dot( tmp, PM );
        return K;
    }

    fem.barStress = function( elemID )   
    {
        var self = this;         
        var theElm = self._model["elements"][elemID]; 
        var nodesIDList = theElm["node"]; 
        var area = theElm["area"]; 

        var lenVector = self.calcuTwoNodeVector(nodesIDList[0], nodesIDList[1]);
        var len = lenVector[0];
        var PM = [
            [lenVector[1], lenVector[2], lenVector[3], 0.0, 0.0, 0.0 ], 
            [0.0, 0.0, 0.0, lenVector[1], lenVector[2], lenVector[3]]
        ]; 

        var bar_dof_id_list = [];
        var bar_dof_index = 0;
        for( var item in nodesIDList ) 
        {
            var nodeID = nodesIDList[item];
            var theNode = self._model["nodes"][String(parseInt(nodeID))]; 
            var dofID =  theNode["dofID"];
            var dofs =  theNode["dof"];
            var i = 0;
            for( var it in dofs )
            {
                var bar_dof_global_index = dofID + i;
                bar_dof_id_list[bar_dof_index] = bar_dof_global_index;
                i++;
                bar_dof_index++;
            }
        }

        var bar_u = [];
        bar_dof_index = 0;
        for( var item in bar_dof_id_list ) 
        {
            var id = bar_dof_id_list[item]; 
            bar_u[bar_dof_index] = self._U[id];
            bar_dof_index++;
        }

        var tmp = numeric.dot( PM, bar_u ); 
        var B = [-1.0/len, 1.0/len];
        var mateType = theElm["material"];
        var material = self._model["materials"][mateType]; 
        var E = parseFloat( material["E"]); 
        var stress = numeric.dot( B, tmp ); 
        stress *= E;
 
        //console.log( "stress = ", stress );
    }



    // constructing spring element stiffness matrix 
    fem.spring = function( elemID )   
    {
        var self = this; 
        
        var theElm = self._model["elements"][elemID]; 
        var nodesIDList = theElm["node"];
        //console.log("nodes:", nodes );

        var mateType = theElm["material"];
        //console.log("spring mateType:", mateType );

        var material = self._model["materials"][mateType]; 
        var k = parseFloat( material["k"]); 
        //console.log("spring k:", k );
        var K_e = [[ k, -k], [-k, k]]; 

        var n_1 = self._model["nodes"][ String(nodesIDList[0]) ];
        var n_2 = self._model["nodes"][ String(nodesIDList[1]) ];

        var dx = parseFloat(n_2["coords"]["x"]) - parseFloat(n_1["coords"]["x"]);
        var dy = parseFloat(n_2["coords"]["y"]) - parseFloat(n_1["coords"]["y"]);
        var dz = parseFloat(n_2["coords"]["z"]) - parseFloat(n_1["coords"]["z"]);

        var d = [ dx, dy, dz];
        var len = Math.sqrt( d[0]*d[0] + d[1]*d[1] + d[2]*d[2] ); 

        var c_alpha = d[0] / len; 
        //s_alpha = Math.sqrt( 1 - c_alpha * c_alpha );
        var c_beta = d[1] / len; 
        //s_beta = Math.sqrt( 1 - c_beta * c_beta );
        var c_gamma = d[2] / len; 
        //s_gamma = Math.sqrt( 1 - c_gamma * c_gamma );
        
        var PM = [
            [c_alpha, c_beta, c_gamma, 0.0, 0.0, 0.0 ], 
            [0.0, 0.0, 0.0, c_alpha, c_beta, c_gamma]
        ];

        var PM_T = numeric.transpose( PM );
        //console.log("PM = ", PM); 
        //console.log("PM_T = ", PM_T); 

        //console.log("K_e = ", K_e); 
        var tmp = numeric.dot( PM_T, K_e ); 

        //console.log("K_tmp = ", tmp); 

        var K = numeric.dot( tmp, PM );
        //console.log("K = ", K); 
        return K;
    }

    // 
    fem.addGSM = function( elemID )   
    {
        var self = this; 
        var type = self._model["elements"][String(elemID)]["type"];

        // console.log( "element ", type, elemID);

        var elmStiffMatrix;

        if( type ==  "spring")
        {
            elmStiffMatrix = self.spring(elemID);
        }else if( type ==  "bar")
        {
            elmStiffMatrix = self.bar(elemID);
        }

        console.log(" element matrix K:", type, elemID ); 
        //console.log( elmStiffMatrix );  
        var str = " element matrix K:" + type + elemID;  
        self.show(str); 
        self.showMatrix( elmStiffMatrix );  

        var elmDOFVec = [];
        var nodeDOFVec = []; 
        var elmDOFID = 0;
        var theElm = self._model["elements"][elemID]; 
        var nodes = theElm["node"]; 

        for( var item in nodes )
        {
            var theNode = nodes[item];
            var firstDOFID = self._model["nodes"][ String(theNode) ]["dofID"]; 
            var nodeDOFNum = self._model["nodes"][ String(theNode) ]["dofnum"];        
            console.log( "firstDOFID ", firstDOFID); 
            for( var i = 0; i < parseInt(nodeDOFNum); i++)
            {
                elmDOFVec[parseInt(elmDOFID)] = parseInt(firstDOFID);
                firstDOFID++;
                elmDOFID++;
            }
        }
        console.log( "elmDOFVec ", elmDOFVec );
        var elmDOFNum = elmDOFVec.length; 
        for( var j = 0; j < parseInt(elmDOFNum); j++)
        {
            for( var k = 0; k < parseInt(elmDOFNum); k++)
            {
                var s = elmStiffMatrix[j][k];
                var gsmID_j =  elmDOFVec[j];
                var gsmID_k =  elmDOFVec[k];
                self._globalStiffMatrix[gsmID_j][gsmID_k] += parseFloat(s);
            }
        }
    }




    fem.assembly = function( )   
    {
        var self = this; 
        
        self.calcuGlobalDOF();

        for( var elem in self._model["elements"] )
        {
            self.addGSM(elem) ;
        }
        // console.log( "assembly: globalStiffMatrix " );
        // console.log( self._globalStiffMatrix); 
        self._oriGlobalStiffnessMatrix = numeric.clone(self._globalStiffMatrix);
    }

    fem.getGlobalDOFID = function( theNodeID, theDOFIDofNode )
    {
        var self = this; 
        if( parseInt(theDOFIDofNode) < 0 )
        {
            return -1;
        }          
        var firstDOFID = self._model["nodes"][ String(theNodeID) ]["dofID"]; 
        var nodeDOFNum = self._model["nodes"][ String(theNodeID) ]["dofnum"]; 
        if( parseInt(theDOFIDofNode) > parseInt(nodeDOFNum) )
        {
            return -1;
        }  
        return parseInt(firstDOFID) + parseInt(theDOFIDofNode) - 1;
    }



    fem.forceConstraint = function( theNodeID, theDOFIDofNode, theForce)
    {
        var self = this; 
        var result = true;
        result = self.checkingObject( theNodeID )
        if(! Boolean( result ))
        {
            return;
        }
        result = self.checkingObject( theDOFIDofNode )
        if(! Boolean( result ))
        {
            return;
        }
        result = self.checkingObject( theForce )
        if(! Boolean( result ))
        {
            return;
        }
        var dofID = fem.getGlobalDOFID( theNodeID, theDOFIDofNode );
        if( parseInt(dofID) < 0 )
        {
            console.error("forceConstraint: Invalid DOF index");
            return -1;
        }  
        self._F[parseInt(dofID)] = parseFloat(theForce);
    }



    fem.displacementConstraint = function( theNodeID, theDOFIDofNode, theDisp )
    {
        var self = this; 
        var result = true;
        result = self.checkingObject( theNodeID )
        if(! Boolean( result ))
        {
            console.log( "displacementConstraint: invalid node ID" );
            return;
        }
        result = self.checkingObject( theDOFIDofNode )
        if(! Boolean( result ))
        {
            console.log( "displacementConstraint: invalid node DOF ID" );
            return;
        }
        result = self.checkingObject( theDisp )
        if(! Boolean( result ))
        {
            console.log( "displacementConstraint: invalid displacement ", theDisp );
            return;
        }
        var dofID = fem.getGlobalDOFID( theNodeID, theDOFIDofNode );
        if( parseInt(dofID) < 0 )
        {
            console.error("displacementConstraint: Invalid DOF index");
            return -1;
        }  
        //self._U[parseInt(dofID)] = 1.0;  
        for( var i = 0; i < parseInt(self._globalDOF); i++)
        {
            self._globalStiffMatrix[parseInt(i)][parseInt(dofID)] = 0.0; 
            self._globalStiffMatrix[parseInt(dofID)][parseInt(i)] = 0.0; 
        }
        if( Math.abs(parseFloat(theDisp)) > 0.0001) {
            self._F[parseInt(dofID)] = parseFloat(theDisp); 
            self._globalStiffMatrix[parseInt(dofID)][parseInt(dofID)] = 1.0; 
        }else{
            console.log("ZERO displacement ");
            self._globalStiffMatrix[parseInt(dofID)][parseInt(dofID)] = 900000.0; 
        }
    }    

    fem.loadcase = function( loadcaseID )
    {
        var self = this; 
        var result = self.checkingObject( loadcaseID );  
        if(! Boolean( result ))
        {
            console.error("loadcase(): invalid load case id");
            return;
        }

        var theloadcase = self._model["loadcases"][String(loadcaseID)];
        for(var id in theloadcase)
        {
            var theload = theloadcase[id]; 
            var type = theload["type"]; 
            var nodeid = theload["nodeid"]; 
            var localDOFidList = theload["localDOFid"]; 
            var loadvalueList = theload["value"]; 
            if( type == "displacement"){
                for(var dofid in localDOFidList )
                {
                    var localDOFid = localDOFidList[dofid];
                    var value = loadvalueList[dofid]; 
                    //console.log( "displacement dof id = ", localDOFid, " value = ", value);
                    self.displacementConstraint( nodeid, localDOFid, value );
                }
            }
            if( type == "force"){
                for(var dofid in localDOFidList )
                {
                    var localDOFid = localDOFidList[dofid];
                    var value = loadvalueList[dofid];
                    //console.log( "force dof id = ", localDOFid, " value = ", value);
                    self.forceConstraint( nodeid, localDOFid, value );
                }
            }
        }

    }

    fem.solve = function()
    {
        var self = this; 
        self.chekcGSM(); 
        self._U = numeric.solve( self._globalStiffMatrix, self._F);
        self._F = numeric.dot( self._oriGlobalStiffnessMatrix, self._U); 
        self.show("Displacement:"); 
        self.showMatrix( self._U );          
        self.show("F:"); 
        self.showMatrix( self._F );  
    }

    fem.chekcGSM = function()
    {
        var self = this; 
        var ZERO = 0.000001;
        for( var i = 0; i < parseInt(self._globalDOF); i++)
        {
            var allZero = true; 
            var tmpVector = self._globalStiffMatrix[parseInt(i)];
            for( var j = 0; j < parseInt(self._globalDOF); j++)
            {
                if(parseFloat( tmpVector[parseInt(j)]) > parseFloat( ZERO ) )
                {
                    allZero = false;                  
                }
            }
            if(Boolean( allZero ))
            {
                self._globalStiffMatrix[parseInt(i)][parseInt(i)] = 1.0; 
            }
        }
    }
 
