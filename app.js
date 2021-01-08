
function init_WebGL(canvas,w,h){
    var gl = canvas.getContext('webgl');

    if(!gl){
        console.log('WebGL not support, falling back on experimental');
        gl = canvas.getContext('experimental-webgl');
    }
    if(!gl){
        alert('Your browser does not support WebGL');
    }

    var ext = gl.getExtension('OES_element_index_uint');//Not using ext atm but this is needed in elementdraw to suport u_int


    set_width_height(gl,canvas,w,h);

    return gl;
}

function create_gpu_program(gl,src_vertex_shader,src_fragment_shader){

    var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
    var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertex_shader,src_vertex_shader);
    gl.shaderSource(fragment_shader,src_fragment_shader);

    gl.compileShader(vertex_shader);
    gl.compileShader(fragment_shader);
    if(!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)){
        console.error('ERROR compiling vertex shader!',gl.getShaderInfoLog(vertex_shader));
        return -1;
    }
    if(!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)){
        console.error('ERROR compiling fragment shader!',gl.getShaderInfoLog(fragment_shader));
        return -1;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        console.error('ERROR linking program!',gl.getProgramInfoLog(program));
        return -1;//Mhmm?
    }
    gl.validateProgram(program);
    if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)){
        console.error('ERROR validating program!',gl.getProgramInfoLog(program));
        return -1;
    }
    return program;
}


function create_buffers(gl,vertices,elements,vaoExt){
    const vao = vaoExt['createVertexArrayOES']();
    vaoExt['bindVertexArrayOES'](vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int32Array(elements), gl.STATIC_DRAW);//int?


    return {vao:vao,vbo:vbo,ebo:ebo};

}

function init_buffers(gl,shader_program,vertices,elements,state,vaoExt){
    var buffers = create_buffers(gl,vertices,elements,vaoExt);// creates and binds
    set_attrib_location(gl,shader_program,state); //             Order between this line and the above  is important
    //set_attrib_location uses the vbo which was most recently bound.!!!

    return buffers;
}


function set_attrib_location(gl,shader_program,state){

    var positionAttribLocation = gl.getAttribLocation(shader_program, 'vert_position');
    switch(state){
        case 'render':
            gl.vertexAttribPointer(
                positionAttribLocation, //Attribute location
                2,  //Elements per attribute (vec2)
                gl.FLOAT,//Type of elements
                gl.FALSE,//Normalized?
                4* Float32Array.BYTES_PER_ELEMENT,//Size of individual vertex
                0//Offset from beginning to this attribute   //Slighlty didfferent from C check for errors.
                );


            var textureAttribLocation = gl.getAttribLocation(shader_program, 'tex_position');
            gl.vertexAttribPointer(
                textureAttribLocation, //Attribute location
                2,  //Elements per attribute (vec2)
                gl.FLOAT,//Type of elements
                gl.FALSE,//Normalized?
                4* Float32Array.BYTES_PER_ELEMENT,//Size of individual vertex
                2* Float32Array.BYTES_PER_ELEMENT//Offset from beginning to this attribute   //Slighlty didfferent from C check for errors.
                );

            gl.enableVertexAttribArray(textureAttribLocation);
            break;
        case 'draw':
            gl.vertexAttribPointer(
                positionAttribLocation, //Attribute location
                2,  //Elements per attribute (vec2)
                gl.FLOAT,//Type of elements
                gl.FALSE,//Normalized?
                2* Float32Array.BYTES_PER_ELEMENT,//Size of individual vertex
                0//Offset from beginning to this attribute
                );

                break;

        }
    
    gl.enableVertexAttribArray(positionAttribLocation);

}

class timerClass{
    constructor() {
        var d = new Date(); 
        const start_time =d.getTime();
        
        this.get_elapsed_time = function(){
            var d = new Date(); 
            return d.getTime()-start_time;
        }
    }

}

function draw_scene(gl){
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
}

function render_to_screen(gl){
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
}

function update_cpu_data(timer){
    t_elapsed = timer.get_elapsed_time();
    data = {time: t_elapsed}
    return data;
}
function get_uniform_locations(gl,shader_program){
    const uni_time = gl.getUniformLocation(shader_program,"time");
    const uni_color_attach = gl.getUniformLocation(shader_program,"color_attach");
    const uni_tex = gl.getUniformLocation(shader_program,"tex");
    const uni_step = gl.getUniformLocation(shader_program,"step");
    const uni_rng_seed = gl.getUniformLocation(shader_program,"rng_seed");
    const uni_birth_prob = gl.getUniformLocation(shader_program,"birth_prob");
    const uni_colors =gl.getUniformLocation(shader_program,"colors");
    const uni_resolution_x =gl.getUniformLocation(shader_program,"resolution_x");
    const uni_resolution_y =gl.getUniformLocation(shader_program,"resolution_y");
    uniforms = {u_time : uni_time,u_color_attach : uni_color_attach, u_tex : uni_tex, u_step : uni_step, u_rng_seed: uni_rng_seed,u_birth_prob: uni_birth_prob, u_colors: uni_colors,
                u_resolution_x : uni_resolution_x, u_resolution_y: uni_resolution_y};
    return uniforms;
}

function upload_data_to_gpu(gl,data,uniforms,color_attach,step){
    gl.uniform1f(uniforms.u_time,data.time); // Maybe convert to float?
    gl.uniform1i(uniforms.u_color_attach,color_attach); 
    gl.uniform1i(uniforms.u_step,step); 
}
function set_width_height(gl,canvas,w,h){
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0,0,w,h);

}
var reset_true=0;
function button_press() {
    reset_true=1;
    console.log('You pressed the button ' , reset_true , 'times');
    console.log('Reset now with' , reset_true , 'times');
    console.log(document.getElementById("All occupied").checked,document.getElementById("Half occupied").checked,document.getElementById("Single cell").checked);
}

var simulation_speed = 2;
function updatebirthSlider(slideAmount) {
    document.getElementById("birth_print").innerHTML = "Birth probability: ".concat((slideAmount/1000).toString());
}
function updatespeedSlider(slideAmount) {
    simulation_speed = slideAmount;
    document.getElementById("simspeed").innerHTML = "Simulation speed: ".concat(simulation_speed.toString());
}
var zoom =1;
function zoom_func(event){
   zoom += event.deltaY * 0.01 *0.1;
   //zoom = 0.5;
   console.log(event.deltaY)
}
function set_texture_settings(gl,tex_setting){
    switch(tex_setting){
        case(0)://Working
            
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);//LINEAR
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            break;
        case(1)://DOesnt work at all?
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);//LINEAR
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            break;
        case(2)://DOesnt work at all?
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);//LINEAR
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            break;
        case(3)://Half working , only on white part. use debug in init to set half the screen to white.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);//LINEAR
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            break;

    }
}


function InitDemo(){
    var canvas = document.getElementById('game-surface');
    const viewport_width = parseInt(screen.width*0.95);
    const viewport_height= parseInt(0.7*(screen.height));//parseInt(screen.height);//parseInt(800*0.75);//
    const tex_width= viewport_width;
    const tex_heigth= viewport_height;//Serious bug if not the same :(
    var gl=init_WebGL(canvas,viewport_width,viewport_height);//(.,width , height)
    canvas.onwheel = zoom_func;
    
    var vaoExt = gl.getExtension('OES_vertex_array_object');//Todo make this neater
    var drawbuf = gl.getExtension('WEBGL_draw_buffers');//Todo make this neater

    init_shader_program = create_gpu_program(gl,src_vertex_init,src_fragment_init);
    draw_shader_program = create_gpu_program(gl,src_vertex_draw,src_fragment_draw);
    render_shader_program = create_gpu_program(gl,src_vertex_render,src_fragment_render);

    const vertices_square = 
    [
    -1.0, 1.0, // Top left
    1.0, 1.0, // Top right
    1.0, -1.0, // bottom right
    -1.0, -1.0, // bottom left

    ];
    const elements = 
    [ 
        0, 1, 2,
        2, 3, 0
    ];
    const vertices_texture = [
        //Square_x Square_y Tex_x Tex_y
        -1.0, 1.0, 0.0, 0.0, // Top left
        1.0, 1.0, 1.0, 0.0, // Top right
        1.0, -1.0,  1.0, 1.0,// bottom right
        -1.0, -1.0, 0.0, 1.0, // bottom left
    ];

    initial_buffers = init_buffers(gl,init_shader_program,vertices_square,elements,'draw',vaoExt );//draw vs init shader program? Hmmm
    draw_buffers = init_buffers(gl,draw_shader_program,vertices_texture,elements,'render',vaoExt );
    render_buffers = init_buffers(gl,render_shader_program,vertices_texture,elements,'render',vaoExt );


    //Gpu datas
    const uniforms_draw = get_uniform_locations(gl,draw_shader_program);
    const uniforms_init ={uni_left:gl.getUniformLocation(init_shader_program,"u_left") , uni_right:gl.getUniformLocation(init_shader_program,"u_right")}

    //Cpu datas
    var timer =  new timerClass;




    const tex_setting =3;
    //Texture
    gl.activeTexture(gl.TEXTURE0);
    const tex_src = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex_src);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, tex_width,tex_heigth, 0, gl.RGB, gl.UNSIGNED_BYTE, null);//0 vs NULL in last? WTF is this
    set_texture_settings(gl,tex_setting);
    
    gl.activeTexture(gl.TEXTURE1);//Make this 0??
    const tex_dest = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex_dest);//Maybe something with this????
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, tex_width,tex_heigth, 0, gl.RGB, gl.UNSIGNED_BYTE, null);//performance !! rgb vs r
    set_texture_settings(gl,tex_setting);


    
    const fbo0 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo0);
    //gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex_src, 0);
    //gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, tex_dest, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, drawbuf.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, tex_src, 0);

    
    const fbo1 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1);//Do i really need different color attachment when using two framebuffers?
    gl.framebufferTexture2D(gl.FRAMEBUFFER, drawbuf.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, tex_dest, 0);
    var color_attach =1; //


    gl.useProgram(render_shader_program);
    gl.uniform1i(gl.getUniformLocation(render_shader_program, "tex"), 0);


    //What to draw?
    gl.clearColor(0.0,0.0,0.0,1.0);//Is this program dependent?? , not sure



   
    
    gl.useProgram(draw_shader_program);
    gl.uniform1f(uniforms_draw.u_rng_seed,Math.random()); // Maybe convert to float?
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo0);
    drawbuf['drawBuffersWEBGL']([drawbuf.COLOR_ATTACHMENT0_WEBGL,drawbuf.COLOR_ATTACHMENT1_WEBGL]);//When calling this makes sure fbo is bound!!!!!!!!!!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1);
    drawbuf['drawBuffersWEBGL']([drawbuf.COLOR_ATTACHMENT0_WEBGL,drawbuf.COLOR_ATTACHMENT1_WEBGL]);//When calling this makes sure fbo is bound!!!!!!!!!!
    gl.clearColor(0.0,0.0,0.0,1.0);//Is this program dependent?? , not sure
 
    //Init
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo0);//fbo0
    vaoExt['bindVertexArrayOES'](initial_buffers.vao);
    gl.useProgram(init_shader_program);
    gl.uniform1i(uniforms_init.uni_left,parseInt(tex_width/4));
    gl.uniform1i(uniforms_init.uni_right,parseInt(3*tex_width/4));
    draw_scene(gl);
    //Need to use two framebuffers?
    
    //Draw
    var step=1;

    var birth_prob = 0.674;
    gl.useProgram(draw_shader_program);
    gl.uniform1f(uniforms_draw.u_birth_prob,birth_prob);
    gl.uniform1i(uniforms_draw.u_colors,1);
    gl.uniform1i(uniforms_draw.u_resolution_x,tex_width);
    gl.uniform1i(uniforms_draw.u_resolution_y,tex_heigth);

    var loop = function(){


        for(i=0;i<simulation_speed;i++){
            var data = update_cpu_data(timer);

            gl.useProgram(draw_shader_program);
            vaoExt['bindVertexArrayOES'](draw_buffers.vao);
            upload_data_to_gpu(gl,data,uniforms_draw,color_attach,step);//uniforms vs uniforms_draw??
            gl.uniform1f(uniforms_draw.u_rng_seed,Math.random()); // Maybe convert to float?
            if(color_attach==0){
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo0);// 0 or 1?? one causes error , one doesn't
                gl.uniform1i(gl.getUniformLocation(draw_shader_program, "tex"),1);
                color_attach= 1;
            }else{
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1);
                gl.uniform1i(gl.getUniformLocation(draw_shader_program, "tex"),0);
                color_attach= 0;
            }

            draw_scene(gl);
            step=step+1;
        }
        if(reset_true==1&&simulation_speed>0){
            gl.useProgram(draw_shader_program);
            if(document.getElementById("myCheck2").checked==true){
                birth_prob = 0.32;
            }else{
                birth_prob =  document.getElementById("myRange2").value/1000;
            }
            //document.getElementById("birth_print").innerHTML = "Birth probability: ".concat(birth_prob.toString());
            gl.uniform1f(uniforms_draw.u_birth_prob,birth_prob);



            //simulation_speed =  document.getElementById("myRange3").value;
            //document.getElementById("simspeed").innerHTML = "Simulation speed = ".concat(simulation_speed.toString());


            if(document.getElementById("myCheck").checked==true){
                gl.uniform1i(uniforms_draw.u_colors,1) ;
            }else{
                gl.uniform1i(uniforms_draw.u_colors,0) ;
            }

            gl.useProgram(init_shader_program);
            if(document.getElementById("All occupied").checked==true){//Take this out of loop
                gl.uniform1i(uniforms_init.uni_left,0);
                gl.uniform1i(uniforms_init.uni_right,parseInt(viewport_width));//MIGHT GIVE TROUBLE IF NOT AN INT
            }else if(document.getElementById("Half occupied").checked==true){
                gl.uniform1i(uniforms_init.uni_left,parseInt(viewport_width/4));//MIGHT GIVE TROUBLE IF NOT AN INT
                gl.uniform1i(uniforms_init.uni_right,parseInt(3*viewport_width/4));//MIGHT GIVE TROUBLE IF NOT AN INT
            }else if(document.getElementById("Single cell").checked==true){//Single cell
                gl.uniform1i(uniforms_init.uni_left,parseInt(viewport_width/2 -5));//MIGHT GIVE TROUBLE IF NOT AN INT
                gl.uniform1i(uniforms_init.uni_right,parseInt(viewport_width/2 +5));//MIGHT GIVE TROUBLE IF NOT AN INT
            }
            draw_scene(gl);
            step =0;
            reset_true=0;
            
        }else if(reset_true==1&&simulation_speed==0){
            simulation_speed = 1;
            document.getElementById("myRange3").value = simulation_speed;
            document.getElementById("simspeed").innerHTML = "Simulation speed = ".concat(simulation_speed.toString());

        }
        
        gl.useProgram(render_shader_program);
        gl.uniform1f(gl.getUniformLocation(render_shader_program,"zoom"),zoom);
        vaoExt['bindVertexArrayOES'](render_buffers.vao);//Can leave this out apparently slightly hacky thought
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        if(color_attach == 0){
            gl.uniform1i(gl.getUniformLocation(render_shader_program, "tex"), 1);
        }else{
            gl.uniform1i(gl.getUniformLocation(render_shader_program, "tex"), 0);
        }
        render_to_screen(gl);

        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

};


const src_vertex_render=`
precision highp float;///maybe make this highp
    

    attribute vec2 vert_position;
    attribute vec2 tex_position;

    varying vec2 tex_pos;

    void main(){
        gl_Position = vec4(vert_position.x,-vert_position.y, 0.0 , 1.0);
        tex_pos = tex_position;
    }
`
const src_fragment_render=`
precision highp float;///maybe make this highp

    uniform sampler2D tex;
    uniform float zoom;
    varying vec2 tex_pos;

    void main(){
        gl_FragData[0] = texture2D(tex,zoom*(tex_pos-0.5)+0.5);//Replace this????deprecated
    }
`
const src_vertex_draw=`
precision highp float;///maybe make this highp

    attribute vec2 vert_position;
    attribute vec2 tex_position;

    varying vec2 tex_pos;


    void main(){
        gl_Position = vec4(vert_position.x,-vert_position.y, 0.0 , 1.0);
        tex_pos = tex_position;
    }
`
const src_fragment_draw=`
    #extension GL_EXT_draw_buffers : enable
    precision highp float;///maybe make this highp

    uniform float time;
    uniform int color_attach;
    uniform sampler2D tex;
    uniform int step;
    uniform float rng_seed;
    uniform float birth_prob;
    uniform int colors;
    uniform int resolution_x;
    uniform int resolution_y;
    varying vec2 tex_pos;

    
    float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    void main(){
        float p = birth_prob;//0.6447;
        float pix_width_x = 1.0/float(resolution_x);//TODO:Change this to uniform reso
        float pix_width_y = 1.0/float(resolution_y);//TODO:Change this to uniform reso
        
        vec4 downleft = texture2D(tex, vec2(tex_pos.x-pix_width_x,tex_pos.y-pix_width_y));
        vec4 downright = texture2D(tex, vec2(tex_pos.x+pix_width_x,tex_pos.y-pix_width_y));
        if(color_attach == 0 ){
            gl_FragData[0] = texture2D(tex,tex_pos);
            //
            if(int(800.0*tex_pos.y)==step){
                if( downleft.x>0.0&& rand(rng_seed*tex_pos) < p){
                        if(colors==1){
                            gl_FragData[0] = vec4(0.3+0.4*(sin(0.008*float(step))+1.0),0.5-0.15*(sin(0.017*float(step))+1.0),1.0-0.3*(sin(0.011*float(step))+1.0),1.0);
                        }else{
                            gl_FragData[0] = vec4(1.0,0.0,0.0,1.0);
                        }
                }
                if( downright.x>0.0&& rand(rng_seed*tex_pos) < p){
                        if(colors==1){
                            gl_FragData[0] = vec4(0.3+0.4*(sin(0.008*float(step))+1.0),0.5-0.15*(sin(0.017*float(step))+1.0),1.0-0.3*(sin(0.011*float(step))+1.0),1.0);
                        }else{
                            gl_FragData[0] = vec4(1.0,0.0,0.0,1.0);
                        }
                }
            }  
            

           
        } else{
            gl_FragData[1] = texture2D(tex,tex_pos) ;
            
            
            if(int(800.0*tex_pos.y)==step){
                if( downleft.x>0.0&& rand(rng_seed*tex_pos) < p){
                        if(colors==1){
                            gl_FragData[1] = vec4(0.3+0.4*(sin(0.008*float(step))+1.0),0.5-0.15*(sin(0.017*float(step))+1.0),1.0-0.3*(sin(0.011*float(step))+1.0),1.0);
                        }else{
                            gl_FragData[1] = vec4(1.0,0.0,0.0,1.0);
                        }
                }
                if( downright.x>0.0&& rand(rng_seed*tex_pos) < p){
                        if(colors==1){
                            gl_FragData[1] = vec4(0.3+0.4*(sin(0.008*float(step))+1.0),0.5-0.15*(sin(0.017*float(step))+1.0),1.0-0.3*(sin(0.011*float(step))+1.0),1.0);
                        }else{
                            gl_FragData[1] = vec4(1.0,0.0,0.0,1.0);
                        }
                }
            }  
            

        }
    }
`

const src_vertex_init=`
precision highp float;///maybe make this highp

    attribute vec2 vert_position;


    void main(){
        gl_Position = vec4(vert_position, 0.0 , 1.0);
    }
`
const src_fragment_init=`
#extension GL_EXT_draw_buffers : enable
precision highp float;///maybe make this highp
    uniform int u_left;
    uniform int u_right;

    void main(){

        //int left =200;
        //int right=600;
        gl_FragData[0] = vec4(0.0,0.0,0.0,1.0);
        gl_FragData[1] = vec4(0.0,0.0,0.0,1.0);
        if(int(gl_FragCoord.x)>u_left &&int(gl_FragCoord.x)<u_right &&int(gl_FragCoord.y)==0){
            gl_FragData[0] = vec4(1.0,1.0,1.0,1.0);
            gl_FragData[1] = vec4(1.0,1.0,1.0,1.0);
        }


        //FOR debugging
        gl_FragData[0] = vec4(0.0,0.0,0.0,1.0);
        gl_FragData[1] = vec4(0.0,0.0,0.0,1.0);
        if(int(gl_FragCoord.x)>u_left &&int(gl_FragCoord.x)<u_right &&int(gl_FragCoord.y)==0){
            gl_FragData[0] = vec4(1.0,1.0,1.0,1.0);
            gl_FragData[1] = vec4(1.0,1.0,1.0,1.0);
        }
    }
`