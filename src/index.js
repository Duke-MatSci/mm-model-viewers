/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* NOTE: should be able to get away from this secondary project once VueJS of main project
   is updated to Vue CLI 4.x
 */
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader'
import vtkSTLReader from 'vtk.js/Sources/IO/Geometry/STLReader'
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader'
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper'
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor'
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer'
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow'
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow'
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor'
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera'


const iOS = /iPad|iPhone|iPod/.test(window.navigator.platform);
if (iOS) {
  document.querySelector('body').classList.add('is-ios-device');
}

function emptyModelContainer (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
}

function loadModel (container, options) {
  let vtk = {}
  try {
    emptyModelContainer(container)
    vtk.renderWindow = vtkRenderWindow.newInstance()
    vtk.renderer = vtkRenderer.newInstance({background: options.bgColor, width: '100%', height: '100%'})
    vtk.renderWindow.addRenderer(vtk.renderer)
    vtk.openglRenderWindow = null
    vtk.openglRenderWindow = vtkOpenGLRenderWindow.newInstance()
    vtk.renderWindow.addView(vtk.openglRenderWindow)
    vtk.openglRenderWindow.setContainer(container)
    let {width, height} = container.getBoundingClientRect()
    vtk.openglRenderWindow.setSize(width, height)
    vtk.interactor = vtkRenderWindowInteractor.newInstance()
    vtk.interactor.setView(vtk.openglRenderWindow)
    vtk.interactor.initialize()
    vtk.interactor.bindEvents(container)
    vtk.interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance())
  } catch (ex) {
    let msg = 'Error setting up for model read: ' + ex
    console.log(msg)
  }
  let reader = new FileReader()
  /* eslint-disable-next-line */
  reader.onload = function onLoad (e) {
    try {
      let modelReader = null
      if (options.ext === 'obj') {
        modelReader = vtkOBJReader.newInstance()
        modelReader.parseAsText(reader.result)
      } else if (options.ext === 'stl') {
        modelReader = vtkSTLReader.newInstance()
        modelReader.parseAsArrayBuffer(reader.result)
      } else if (options.ext === 'vtp') {
        modelReader = vtkXMLPolyDataReader.newInstance()
        modelReader.parseAsArrayBuffer(reader.result)
      }
      const nmOut = modelReader.getNumberOfOutputPorts()
      for (let idx = 0; idx < nmOut; ++idx) {
        const source = modelReader.getOutputData(idx)
        const mapper = vtkMapper.newInstance()
        const actor = vtkActor.newInstance()
        actor.setMapper(mapper)
        mapper.setInputData(source)
        vtk.renderer.addActor(actor)
      }
      vtk.renderer.resetCamera()
      vtk.renderWindow.render()
    } catch (ex) {
      let msg = 'Error reading model: ' + ex
      console.log(msg)
    }
  }
  try {
    if (options.ext === 'obj') {
      reader.readAsText(options.file)
    } else if (options.ext === 'stl' || options.ext === 'vtp') {
      reader.readAsArrayBuffer(options.file)
    }
  } catch (ex) {
    let msg = 'Error reading from file reader: ' + ex
    console.log(msg)
  }
}

window.mmModelViewers = {
  loadModel: loadModel
}
