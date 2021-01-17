
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
    gl.deleteShader(vertex_shader);//No longer needed once compiled so can delete to free memory
    gl.attachShader(program, fragment_shader);
    gl.deleteShader(fragment_shader);//No longer needed once compiled so can delete to free memory
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


function create_buffers(gl){
    const vertices_texture = [
        //Square_x Square_y Tex_x Tex_y
        -1.0, 1.0, 0.0, 0.0, // Top left
        1.0, 1.0, 1.0, 0.0, // Top right
        1.0, -1.0,  1.0, 1.0,// bottom right
        -1.0, -1.0, 0.0, 1.0, // bottom left
    ];
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices_texture), gl.STATIC_DRAW);

    const elements = 
    [ 
        0, 1, 2,
        2, 3, 0
    ];
    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int32Array(elements), gl.STATIC_DRAW);//int?


    return {vbo:vbo,ebo:ebo};

}


function set_attrib_location(gl,shader_program){

    var positionAttribLocation = gl.getAttribLocation(shader_program, 'vert_position');
    gl.vertexAttribPointer(
        positionAttribLocation, //Attribute location
        2,  //Elements per attribute (vec2)
        gl.FLOAT,//Type of elements
        gl.FALSE,//Normalized?
        4* Float32Array.BYTES_PER_ELEMENT,//Size of individual vertex
        0//Offset from beginning to this attribute   //Slighlty didfferent from C check for errors.
        ); 
    gl.enableVertexAttribArray(positionAttribLocation);

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

}



function draw_scene(gl){
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
}

function render_to_screen(gl){
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
}



function upload_data_to_gpu(gl,uniforms,color_attach,step){
    gl.uniform1i(uniforms.u_color_attach,color_attach); 
    gl.uniform1i(uniforms.u_step,step); 
}
function set_width_height(gl,canvas,w,h){
    canvas.width = w;
    canvas.height = h;

}
var reset_true=0;
var visible = 0;
function settings_button_press() {
    if(visible == 0){
        document.getElementById("myModal").style = "visibility:visible";
        visible =1;
    }else{
        document.getElementById("myModal").style = "visibility:hidden";
        visible =0;
    }
    //console.log('You pressed the button ' , reset_true , 'times');
    //console.log('Reset now with' , reset_true , 'times');
    //console.log(document.getElementById("All occupied").checked,document.getElementById("Half occupied").checked,document.getElementById("Single cell").checked);
}
function button_press() {
    reset_true=1;
    //console.log('You pressed the button ' , reset_true , 'times');
    //console.log('Reset now with' , reset_true , 'times');
    //console.log(document.getElementById("All occupied").checked,document.getElementById("Half occupied").checked,document.getElementById("Single cell").checked);
}
var grid_x;
function updategridxSlider(slideAmount) {
    grid_x= slideAmount
    document.getElementById("grid_x_print").innerHTML = "Lattice size: ".concat(grid_x.toString());
}
var simulation_speed = 1;
function updatebirthSlider(slideAmount) {
    document.getElementById("birth_print").innerHTML = "Birth probability: ".concat((slideAmount/1000).toString());
}
function updatespeedSlider(slideAmount) {
    simulation_speed = slideAmount;
    document.getElementById("simspeed").innerHTML = "Simulation speed: ".concat(simulation_speed.toString());
}
var zoom =1;
var mouse_x =0;
var mouse_y=0;
onmousemove = function(e){//Make this more efficient. only listen after scrolling or so.
    mouse_x = e.clientX;
    mouse_y = e.clientY;
}
function zoom_func(event){
    if(event.deltaY >0){
        zoom = zoom*1.11*1.11;
    }else{
        zoom = zoom*0.9*0.9;
    }
   //zoom += event.deltaY * 0.01 *0.1;
    if(zoom>1.0){
        zoom=1.0;
    }
   //zoom = 0.5;
   //console.log(event.deltaY)
}
function set_texture_settings(gl){
    // !!3<-WORKS!! is CLAMP_TO_EDGE&NEAREST,1 is REPEAT&NEAREST
    tex_setting = 0;
    switch(tex_setting){
        case(0)://Working !
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);//Hacky way to se this colour to 0: make y==0 squares black.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            break;
        case(1)://Only works if texture width and height are powers of 2....
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);//LINEAR
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            break;
        case(2):
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            break;

    }
}
function get_draw_uniform_locations(gl,shader_program){
    const uni_color_attach = gl.getUniformLocation(shader_program,"color_attach");
    const uni_tex = gl.getUniformLocation(shader_program,"tex");
    const uni_step = gl.getUniformLocation(shader_program,"step");
    const uni_rng_seed = gl.getUniformLocation(shader_program,"rng_seed");
    const uni_birth_prob = gl.getUniformLocation(shader_program,"birth_prob");
    const uni_resolution_x =gl.getUniformLocation(shader_program,"resolution_x");
    const uni_resolution_y =gl.getUniformLocation(shader_program,"resolution_y");
    const uni_bool_zoom =gl.getUniformLocation(shader_program,"bool_zoom");
    uniforms = {u_color_attach : uni_color_attach, u_tex : uni_tex, u_step : uni_step, u_rng_seed: uni_rng_seed,u_birth_prob: uni_birth_prob,
                u_resolution_x : uni_resolution_x, u_resolution_y: uni_resolution_y, u_bool_zoom:uni_bool_zoom};
    return uniforms;
}
function get_render_uniform_locations(gl,shader_program){
    const uni_tex = gl.getUniformLocation(shader_program, "tex");
    const uni_reso_x = gl.getUniformLocation(shader_program, "resolution_x");
    const uni_reso_y = gl.getUniformLocation(shader_program, "resolution_y");
    const uni_colors = gl.getUniformLocation(shader_program, "colors");
    const uni_zoom = gl.getUniformLocation(shader_program,"zoom");
    const uni_mouse_x = gl.getUniformLocation(shader_program,"mouse_x");
    const uni_mouse_y = gl.getUniformLocation(shader_program,"mouse_y");
    const uni_step = gl.getUniformLocation(shader_program,"step");
    const uni_grid_x = gl.getUniformLocation(shader_program,"grid_x");

    return {u_tex : uni_tex, u_reso_x : uni_reso_x , u_reso_y : uni_reso_y,
         u_colors : uni_colors, u_zoom : uni_zoom, u_mouse_x : uni_mouse_x, u_mouse_y : uni_mouse_y, u_step : uni_step, u_grid_x:uni_grid_x};

}
function get_init_uniform_locations(gl,shader_program){
    const uni_left = gl.getUniformLocation(shader_program,"u_left");
    const uni_right = gl.getUniformLocation(shader_program,"u_right");
    
    return {u_left : uni_left, u_right: uni_right};
}
function create_framebuffer_textures(gl,tex_width,tex_height){

    gl.activeTexture(gl.TEXTURE0);
    const tex_src = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex_src);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, tex_width,tex_height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);//0 vs NULL in last? WTF is this
    set_texture_settings(gl);
    
    gl.activeTexture(gl.TEXTURE1);//Make this 0??
    const tex_dest = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex_dest);//Maybe something with this????
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, tex_width,tex_height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);//performance !! rgb vs r
    set_texture_settings(gl);

    return {src:tex_src , dest:tex_dest};

}
function set_framebuffer_textures(gl,tex_width,tex_height,tex_src,tex_dest){

    gl.bindTexture(gl.TEXTURE_2D, tex_src);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, tex_width,tex_height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);//0 vs NULL in last? WTF is this

    gl.bindTexture(gl.TEXTURE_2D, tex_dest);//Maybe something with this????
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, tex_width,tex_height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);//performance !! rgb vs r

}


function InitDemo(){
    var canvas = document.getElementById('game-surface');
    const width  = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const height = window.innerHeight|| document.documentElement.clientHeight|| document.body.clientHeight;
    const viewport_width = parseInt(width);//For PBC need widh to be power of 2....
    const viewport_height= parseInt(height);//screen.height if fullscreen
    var tex_width= parseInt(0.2*viewport_width);
    var tex_height=parseInt(0.2* viewport_height);//Serious bug if not the same: need to figure out how to use gl.viewport correctly.: Do practice example
    var gl=init_WebGL(canvas,viewport_width,viewport_height);//(.,width , height)
    var grid_x_slider = document.getElementById('grid_x_slider');
    grid_x_slider.max =viewport_width;
    grid_x_slider.value =parseInt(0.2*viewport_width);
    document.getElementById("grid_x_print").innerHTML = "Lattice size: ".concat(grid_x_slider.value.toString());

    canvas.onwheel = zoom_func;
    
    var Ext_draw_buffer = gl.getExtension('WEBGL_draw_buffers');//Todo make this neater

    init_shader_program = create_gpu_program(gl,src_vertex_init,src_fragment_init);
    draw_shader_program = create_gpu_program(gl,src_vertex_draw,src_fragment_draw);
    render_shader_program = create_gpu_program(gl,src_vertex_render,src_fragment_render);


    buffers = create_buffers(gl);
    set_attrib_location(gl,init_shader_program);
    set_attrib_location(gl,draw_shader_program);
    set_attrib_location(gl,render_shader_program);



    //Gpu datas
    const uniforms_draw = get_draw_uniform_locations(gl,draw_shader_program);
    const uniforms_init = get_init_uniform_locations(gl,init_shader_program); 
    const uniforms_render = get_render_uniform_locations(gl,render_shader_program);


    //Texture
    fbo_textures = create_framebuffer_textures(gl,tex_width,tex_height);
    
    const fbo0 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, Ext_draw_buffer.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, fbo_textures.src, 0);

    
    const fbo1 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1);//Do i really need different color attachment when using two framebuffers?
    gl.framebufferTexture2D(gl.FRAMEBUFFER, Ext_draw_buffer.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, fbo_textures.dest, 0);
    var color_attach =1; //




    gl.useProgram(render_shader_program);
    gl.uniform1i(uniforms_render.u_tex, 0);
    gl.uniform1i(uniforms_render.u_reso_x, viewport_width);//Maybe want viewport_height instead?
    gl.uniform1i(uniforms_render.u_reso_y, viewport_height);//Maybe want viewport_height instead?
    gl.uniform1i(uniforms_render.u_colors,1);
    grid_x=1.0;//
    gl.uniform1f(uniforms_render.u_grid_x,grid_x);



    //What to draw?
    gl.clearColor(0.0,0.0,0.0,1.0);//Is this program dependent?? , not sure

            
   
    gl.useProgram(draw_shader_program);
    gl.uniform1f(uniforms_draw.u_rng_seed,Math.random()); // Maybe convert to float?
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo0);
    Ext_draw_buffer['drawBuffersWEBGL']([Ext_draw_buffer.COLOR_ATTACHMENT0_WEBGL,Ext_draw_buffer.COLOR_ATTACHMENT1_WEBGL]);//When calling this makes sure fbo is bound!!!!!!!!!!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1);
    Ext_draw_buffer['drawBuffersWEBGL']([Ext_draw_buffer.COLOR_ATTACHMENT0_WEBGL,Ext_draw_buffer.COLOR_ATTACHMENT1_WEBGL]);//When calling this makes sure fbo is bound!!!!!!!!!!
    gl.clearColor(0.0,0.0,0.0,1.0);//Is this program dependent?? , not sure
 
    //Init
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo0);//fbo0
    //vaoExt['bindVertexArrayOES'](initial_buffers.vao);
    gl.useProgram(init_shader_program);
    
    gl.uniform1i(uniforms_init.u_left,parseInt(tex_width/4));
    gl.uniform1i(uniforms_init.u_right,parseInt(3*tex_width/4));
    //gl.viewport(0,0,100,100);//DEBUGGING CARE
    
    gl.viewport(0,0,tex_width,tex_height);
    //    
    draw_scene(gl);
    //Need to use two framebuffers?
    
    //Draw
    var step=1;

    var birth_prob = 0.674;
    gl.useProgram(draw_shader_program);
    gl.uniform1f(uniforms_draw.u_birth_prob,birth_prob);
    gl.uniform1i(uniforms_draw.u_resolution_x,tex_width);
    gl.uniform1i(uniforms_draw.u_resolution_y,tex_height);
    gl.uniform1i(uniforms_draw.u_bool_zoom,0);//Hmm

    var loop = function(){
        gl.useProgram(draw_shader_program);
        if(zoom<0.9){//Move this!!! inefficient
            gl.uniform1i(uniforms_draw.u_bool_zoom,1);
        }else{
            gl.uniform1i(uniforms_draw.u_bool_zoom,0);
        }
        for(i=0;i<simulation_speed;i++){
    
            upload_data_to_gpu(gl,uniforms_draw,color_attach,step);//uniforms vs uniforms_draw??
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

            //gl.viewport(0,0,100,100);//DEBUGGING CARE
            gl.viewport(0,0,tex_width,tex_height);
            draw_scene(gl);
            step=step+1;
        }
        if(reset_true==1&&simulation_speed>0){
            
            tex_width = parseInt(grid_x_slider.value);
            tex_height = parseInt(grid_x_slider.value/viewport_width*viewport_height);
            set_framebuffer_textures(gl,tex_width,tex_height,fbo_textures.src,fbo_textures.dest);
        


            gl.useProgram(draw_shader_program);
            gl.uniform1i(uniforms_draw.u_resolution_x,tex_width);
            gl.uniform1i(uniforms_draw.u_resolution_y,tex_height);
            if(document.getElementById("myCheck2").checked==true){
                birth_prob = 0.32;
            }else{
                birth_prob =  document.getElementById("myRange2").value/1000;
            }
            //document.getElementById("birth_print").innerHTML = "Birth probability: ".concat(birth_prob.toString());
            gl.uniform1f(uniforms_draw.u_birth_prob,birth_prob);



            //simulation_speed =  document.getElementById("myRange3").value;
            //document.getElementById("simspeed").innerHTML = "Simulation speed = ".concat(simulation_speed.toString());


            gl.useProgram(render_shader_program);
            if(document.getElementById("myCheck").checked==true){
                gl.uniform1i(uniforms_render.u_colors,1) ;
            }else{
                gl.uniform1i(uniforms_render.u_colors,0) ;
            }

            gl.useProgram(init_shader_program);
            if(document.getElementById("All occupied").checked==true){//Take this out of loop
                gl.uniform1i(uniforms_init.u_left,0);
                gl.uniform1i(uniforms_init.u_right,parseInt(tex_width));//MIGHT GIVE TROUBLE IF NOT AN INT
            }else if(document.getElementById("Half occupied").checked==true){
                gl.uniform1i(uniforms_init.u_left,parseInt(tex_width/4));//MIGHT GIVE TROUBLE IF NOT AN INT
                gl.uniform1i(uniforms_init.u_right,parseInt(3*tex_width/4));//MIGHT GIVE TROUBLE IF NOT AN INT
            }else if(document.getElementById("Single cell").checked==true){//Single cell
                gl.uniform1i(uniforms_init.u_left,parseInt(tex_width/2 -5));//MIGHT GIVE TROUBLE IF NOT AN INT
                gl.uniform1i(uniforms_init.u_right,parseInt(tex_width/2 +5));//MIGHT GIVE TROUBLE IF NOT AN INT
            }
            //gl.viewport(0,0,100,100);//DEBUGGING CARE
            gl.viewport(0,0,tex_width,tex_height);
            draw_scene(gl);
            step =0;
            reset_true=0;
            
        }else if(reset_true==1&&simulation_speed==0){
            simulation_speed = 1;
            document.getElementById("myRange3").value = simulation_speed;
            document.getElementById("simspeed").innerHTML = "Simulation speed = ".concat(simulation_speed.toString());

        }
        
        gl.useProgram(render_shader_program);
        gl.uniform1f(uniforms_render.u_zoom,zoom);
        gl.uniform1i(uniforms_render.u_mouse_x,mouse_x);//TODO: remove getlocation from this loop, inefficient and unccenesar
        gl.uniform1i(uniforms_render.u_mouse_y,mouse_y);
        gl.uniform1i(uniforms_render.u_step,step);
        //grid_x = grid_x_slider.value/viewport_width;
        //gl.uniform1f(uniforms_render.u_grid_x,grid_x);
        //vaoExt['bindVertexArrayOES'](render_buffers.vao);//Can leave this out apparently slightly hacky thought
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        if(color_attach == 0){
            gl.uniform1i(gl.getUniformLocation(render_shader_program, "tex"), 1);
        }else{
            gl.uniform1i(gl.getUniformLocation(render_shader_program, "tex"), 0);
        }
        //gl.viewport(0,0,viewport_width,viewport_height);//DEBUGGING CARE
        gl.viewport(0,0,viewport_width,viewport_height);
        render_to_screen(gl);//can replace by draw_scene

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
    uniform float zoom;//mousewheel variable
    //uniform float grid_x;//mousewheel variable
    uniform int step;//Don't need this anymore I don't think
    uniform int mouse_x;
    uniform int mouse_y;
    uniform int colors;
    uniform int resolution_x;
    uniform int resolution_y;
    varying vec2 tex_pos;

    void main(){
        vec4 out_color;
        vec2 updated_tex_pos;
        //-------------------------Camera--------------------
        if(zoom<0.99){
            float x = float(mouse_x)/float(resolution_x);//Can this be done more efficiently? the float casting that is. -5
            float y = float(mouse_y)/float(resolution_y);//-7?
            vec2 mouse_pos = vec2(1.0-x,y);
            vec2 dif_from_center = mouse_pos - vec2(0.5,0.5);
            vec2 rescaled_dif_from_center = (1.0-zoom)*dif_from_center;
            vec2 zoom_pos = rescaled_dif_from_center +vec2(0.5,0.5);
            updated_tex_pos = zoom*(tex_pos-zoom_pos)+1.0-zoom_pos;
        }else{
            updated_tex_pos = tex_pos;
        }

        //------------------------Grid_x zoom------------ (Interchange with camera??)
        //if(grid_x<0.99){
        //updated_tex_pos = vec2(grid_x*(updated_tex_pos.x-0.5) +0.5,-grid_x*(1.0-updated_tex_pos.y) +grid_x);//Can w edo this in vertex shader?
        //}
        // --- ---------------------Read texture ---------------
        out_color = texture2D(tex,updated_tex_pos);

        //---------------------Post processing----------
        if(out_color.x>0.0){//Not black
            if(colors==1){
                out_color = vec4(0.3+0.4*(sin(0.008*gl_FragCoord.y)+1.0),0.5-0.15*(sin(0.017*gl_FragCoord.y)+1.0),1.0-0.3*(sin(0.011*gl_FragCoord.y)+1.0),1.0);
            }
        }

        //out_color = 1.0-out_color;//inverts colour , maybe switch randomly :P

        gl_FragData[0] = out_color;
       // gl_FragData[0] = vec4(0.0,1.0,1.0,1.0); //Debug





        //Debugging        
        //if(length(tex_pos-vec2(x,1.0-y))<0.02){
        //    gl_FragData[0] = vec4(length(tex_pos-vec2(x,1.0-y))*50.0,1.0,1.0,1.0);
        //}
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

    uniform int color_attach;
    uniform sampler2D tex;
    uniform int step;
    uniform float rng_seed;
    uniform float birth_prob;
    uniform int resolution_x;
    uniform int resolution_y;
    uniform int bool_zoom;
    varying vec2 tex_pos;

    
    float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    void main(){
        vec4 out_color;
        float p = birth_prob;//0.6447;
        float pix_width_x = 1.0/float(resolution_x);//TODO:Change this to uniform reso
        float pix_width_y = 1.0/float(resolution_y);//TODO:Change this to uniform reso
        
        vec4 downleft = texture2D(tex, vec2(tex_pos.x-pix_width_x,tex_pos.y-pix_width_y));
        vec4 downright = texture2D(tex, vec2(tex_pos.x+pix_width_x,tex_pos.y-pix_width_y));
        out_color = texture2D(tex,tex_pos);
        if(int(float(resolution_y)*tex_pos.y)==step){
            if( downleft.x>0.0&& rand(rng_seed*tex_pos) < p){
                out_color = vec4(1.0,0.0,0.0,1.0);
            }
            if( downright.x>0.0&& rand(rng_seed*tex_pos) < p){
                out_color= vec4(1.0,0.0,0.0,1.0);
            }
        }  
        if(color_attach == 0 ){
            gl_FragData[0] = out_color;
        }else{
            gl_FragData[1] = out_color;
        }



        //Makes sides squares black to get rid of GL_CLAMP_TO_EDGE artifacts
        if(bool_zoom ==1 &&step>2 && (int(tex_pos.y*float(resolution_y))<1 ||int(tex_pos.y*float(resolution_y))>=resolution_y-1 || int(tex_pos.x*float(resolution_x))>=resolution_x-1 || int(tex_pos.x*float(resolution_x))<1 ) ){//CanTTTT remove this from the loop by introducing another shader that runs once after step ==5;
            if(color_attach == 0 ){
                gl_FragData[0] = vec4(0.0,0.0,0.0,1.0);
            }else{
                gl_FragData[1] = vec4(0.0,0.0,0.0,1.0);
            }
            
        }

    }
`

const src_vertex_init=`
precision highp float;///maybe make this highp

    attribute vec2 vert_position;
    attribute vec2 tex_position;
    varying vec2 tex_pos;

    void main(){
        gl_Position = vec4(vert_position, 0.0 , 1.0);
        tex_pos = tex_position;
    }
`
const src_fragment_init=`
#extension GL_EXT_draw_buffers : enable
precision highp float;///maybe make this highp

    uniform int u_left;
    uniform int u_right;

    varying vec2 tex_pos;
    
    void main(){

        //int left =200;
        //int right=600;
        gl_FragData[0] = vec4(0.0,0.0,0.0,1.0);
        gl_FragData[1] = vec4(0.0,0.0,0.0,1.0);
        if(int(gl_FragCoord.x)>u_left &&int(gl_FragCoord.x)<u_right &&int(gl_FragCoord.y)==0){
            gl_FragData[0] = vec4(1.0,0.0,0.0,1.0);
            gl_FragData[1] = vec4(1.0,0.0,0.0,1.0);
        }

    }
`