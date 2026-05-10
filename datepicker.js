// datepicker.js
class CustomDatepicker extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.value = "";
    }

    connectedCallback() {
        this.render();
    }

    getValue() {
        return this.shadowRoot.getElementById('dp-input').value;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: inline-block; width: 100%; }
                .dp-container { position: relative; }
                input {
                    width: 100%;
                    padding: 14px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    box-sizing: border-box;
                    font-size: 14px;
                    font-family: inherit;
                    cursor: pointer;
                    background: #fff;
                    transition: 0.3s;
                }
                input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
            </style>
            <div class="dp-container">
                <input type="date" id="dp-input">
            </div>
        `;
    }
}
customElements.define('custom-datepicker', CustomDatepicker);