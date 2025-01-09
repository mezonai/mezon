const image_window_css = `
body {
    margin: 0;
    font-family: Arial, sans-serif;
    height: 100vh;
    /*display: flex;*/
    background-color: #1a1a1a;
    color: white;
    overflow: hidden;
}

.title-bar {
    height: 21px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    background-color: #1E1F22;
    width: 100vw;
    z-index: 2;
    position: fixed;
}

.app-title {
    width: fit-content;
    margin-left: 12px;
    font-size: 14px;
    font-weight: 600;
    line-height: 26px;
    -webkit-app-region: drag;
    flex: 1;
}

.functional-bar {
    display: grid;
    grid-template-columns: repeat(3, 27px);
    position: absolute;
    top: 0;
    right: 0;
    height: 21px;
}

.function-button {
    cursor: pointer !important;
    z-index: 10 !important;
    color: #a8a6a6;
    gap: 4px;
    width: fit-content;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.function-button:hover {
    background-color: #5b5959 !important;
}

.function-button:active {
    background-color: #989797 !important;
}

.svg-button {
    width: 14px;
}

.zoom-button {
    width: 10px;
}

.functional-bar .function-button {
    grid-row: 1 / span 1;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 21px;
    -webkit-app-region: no-drag;
}

#minimize-window {
    grid-column: 1;
}

#maximize-window,
#restore-button {
    grid-column: 2;
}

#close-window {
    grid-column: 3;
}
.thumbnail-contain-hide{
padding : 0 0 !important;
width : 0 !important;
}
.rotate-width{
  width : calc(100vh - 120px);
}

.main-container {
    display: flex;
    width: 100%;
    height: calc(100vh - 21px);
    overflow: hidden;
    flex-direction: column;
    position: relative;
    top: 21px;
}

.channel-label {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #2e2e2e;
    color: white;
    height: 30px;
    z-index: 2;
}

.image-view {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    height: calc(100% - 56px - 30px);
    flex-direction: row;
}

.selected-image-wrapper {
    flex: 1;
    box-sizing: border-box;
    padding: 20px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.selected-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    transition: transform 0.3s ease;
}

.thumbnail-container {
    width : 92px;
    height: 100%;
    background-color: #0B0B0B;
    padding:  0 10px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
    transition: width 0.3s ease;
    z-index: 2;
}

.thumbnails-content {
    width: fit-content;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px 0;
    overflow-y: scroll;
    scrollbar-width: none;
    -ms-overflow-style: none;
    transition: width 0.3s ease;
    z-index: 2;
}

.thumbnails-content::-webkit-scrollbar {
    display: none;
}

.thumbnail-container::-webkit-scrollbar {
    display: none;
}

.thumbnail-container.hidden {
    width: 0;
    padding: 0;
}

.thumbnail-wrapper {
    width: fit-content;
    height: fit-content;
}

.date-label {
    color: white;
    margin-bottom: 4px;
    text-align: center;
}

.thumbnail {
    width: 88px;
    max-width: 88px;
    overflow: hidden;
    aspect-ratio: 1/1;
    height: 88px;
    object-fit: cover;
    border-radius: 6px;
    cursor: pointer;
    border: 2px solid transparent;
}

.thumbnail.active {
    border-color: white;
}

.thumbnail-overlay {
    display: none;
}

.bottom-bar {
    /*position: fixed;*/
    /*bottom: 0;*/
    /*left: 0;*/
    /*right: 0;*/
    height: 56px;
    background-color: #2e2e2e;
    display: flex;
    align-items: center;
    justify-content: space-between;
    /*padding: 0 16px;*/
    z-index: 2;
    width: 100vw;
}

.sender-info {
    flex: 1;
    display: flex;
    align-items: center;
    margin-left: 16px;
}

.image-controls {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
}

.control-button {
    background: transparent;
    border: none;
    color: white;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.control-button:hover {
    background-color: #434343;
}

.control-button svg {
    width: 20px;
    height: 20px;
}

.divider {
    width: 1px;
    height: 20px;
    background-color: #ffffff;
    opacity: 0.5;
}

.toggle-list {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    margin-right: 16px;
}

@media (max-width: 480px) {
    .thumbnail-container {
        width: 100%;
        height: 100px;
        flex-direction: row;
        overflow-x: scroll;
        overflow-y: hidden;
    }

    .bottom-bar {
        flex-wrap: wrap;
        height: auto;
        padding: 8px;
    }

    .image-controls {
        order: -1;
        width: 100%;
        justify-content: space-around;
    }

}

@media (max-width: 480px) {
  .image-view {
    flex-direction : column;
  }
  .thumbnails-content{
    flex-direction : row;
    gap : 4px;
    height : auto;
      padding: 16px 0 0 0;
      height : 64px;

  }
  .thumbnail {
        width: 54px;
        height: 54px;
    }
        .date-label{
        font-size : 10px;
    position : absolute;
        top : -14px;
        left: 4px;
        }
        .thumbnail-wrapper{
    position : relative;

        }
    .thumbnail-container{
      padding : 10px 0px;
      height : 70px;
    }
      .sender-info{
      display : none;
      }
}

.context-menu {
    position: fixed;
    background: #2e2e2e;
    border-radius: 4px;
    padding: 4px 0;
    min-width: 150px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    display: none;
    z-index: 1000;
}

.context-menu.visible {
    display: block;
}

.menu-item {
    padding: 8px 12px;
    cursor: pointer;
    color: white;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.menu-item:hover {
    background: #434343;
}

.menu-separator {
    height: 1px;
    background-color: #434343;
    margin: 4px 0;
}

    .toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(33, 33, 33, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    }

    .toast.show {
        opacity: 1;
    }


`;
export default image_window_css;
